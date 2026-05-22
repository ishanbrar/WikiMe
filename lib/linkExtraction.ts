import { lookup } from "node:dns/promises";
import net from "node:net";
import type { ExtractedProfileFacts, IntakeData } from "@/types/article";
import { fetchWithTimeout } from "@/lib/fetchTimeout";

const MAX_LINKS = 8;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_CHARS = 450_000;
const MAX_SOURCE_NOTE_CHARS = 2_800;

type LinkExtractionResult = {
  facts: ExtractedProfileFacts;
  logs: string[];
};

type ExtractedLinkSource = {
  url: string;
  title: string;
  description: string;
  text: string;
  contentType: string;
};

const USER_AGENT =
  "WikiMeBot/1.0 (+https://wikime.online; profile link extraction)";

function intakeTextForUrlScan(intake: IntakeData): string {
  return [
    intake.fullName,
    intake.articleTitle,
    intake.birthplace,
    intake.birthday,
    intake.currentLocation,
    intake.education,
    intake.occupation,
    intake.achievements,
    intake.lifeEvents,
    intake.controversies,
    intake.extraNotes,
    intake.pastedProfileText,
  ].join("\n");
}

function normalizeUrl(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/[),.;\]}>]+$/g, "")
    .replace(/^["'(<{\[]+/g, "");
  try {
    const url = new URL(cleaned);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (
      /(^|\.)google\.[a-z.]+$/i.test(url.hostname) &&
      url.pathname === "/url" &&
      url.searchParams.get("url")
    ) {
      return normalizeUrl(url.searchParams.get("url")!);
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function extractUrlsFromText(text: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
    const url = normalizeUrl(match[0]);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= MAX_LINKS) break;
  }
  return urls;
}

function isPrivateIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    return (
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80:")
    );
  }
  return true;
}

async function assertPublicUrl(urlText: string): Promise<void> {
  const url = new URL(urlText);
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("local host blocked");
  }
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error("private IP blocked");
  }
  const records = await lookup(hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("private network address blocked");
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) =>
      String.fromCharCode(Number.parseInt(n, 16)),
    );
}

function firstMatch(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return decodeHtmlEntities(value);
  }
  return "";
}

function tagAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-z_:.-]+)\s*=\s*["']([^"']*)["']/gi)) {
    attrs[match[1]!.toLowerCase()] = decodeHtmlEntities(match[2]!.trim());
  }
  return attrs;
}

function metaValues(html: string, key: string): string[] {
  const values: string[] = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = tagAttrs(match[0]);
    const name = (attrs.name ?? attrs.property ?? "").toLowerCase();
    const content = attrs.content?.trim();
    if (name === key.toLowerCase() && content) values.push(content);
  }
  return values;
}

function firstMeta(html: string, keys: string[]): string {
  for (const key of keys) {
    const value = metaValues(html, key)[0]?.trim();
    if (value) return value;
  }
  return "";
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function parseHtmlSource(url: string, htmlRaw: string, contentType: string): ExtractedLinkSource {
  const html = htmlRaw.slice(0, MAX_HTML_CHARS);
  const title =
    firstMeta(html, ["og:title", "twitter:title"]) ||
    firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description = firstMeta(html, [
    "description",
    "og:description",
    "twitter:description",
    "citation_abstract",
    "dc.description",
  ]);
  const citationTitle = firstMeta(html, ["citation_title", "dc.title"]);
  const citationAuthors = metaValues(html, "citation_author")
    .concat(metaValues(html, "dc.creator"))
    .slice(0, 8);
  const citationJournal = firstMeta(html, [
    "citation_journal_title",
    "citation_publication_title",
  ]);
  const visible = stripHtml(html).slice(0, 2200);
  const citation = [
    citationTitle ? `Publication title: ${citationTitle}` : "",
    citationAuthors.length ? `Authors: ${citationAuthors.join(", ")}` : "",
    citationJournal ? `Journal: ${citationJournal}` : "",
  ].filter(Boolean);
  return {
    url,
    title: citationTitle || title,
    description,
    text: [citation.join("\n"), visible].filter(Boolean).join("\n"),
    contentType,
  };
}

function sourceNote(source: ExtractedLinkSource): string {
  const parts = [
    `Linked source: ${source.url}`,
    source.title ? `Title: ${source.title}` : "",
    source.description ? `Description/abstract: ${source.description}` : "",
    source.text ? `Extracted page text: ${source.text}` : "",
  ].filter(Boolean);
  return parts.join("\n").slice(0, MAX_SOURCE_NOTE_CHARS);
}

async function fetchLinkSource(url: string): Promise<ExtractedLinkSource> {
  await assertPublicUrl(url);
  const res = await fetchWithTimeout(
    url,
    {
      headers: {
        "user-agent": USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.2",
      },
      redirect: "follow",
    },
    FETCH_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (/application\/pdf/i.test(contentType) || /\.pdf($|\?)/i.test(url)) {
    return {
      url,
      title: url.split("/").pop() ?? "PDF source",
      description:
        "PDF detected. WikiMe recorded the publication link; full PDF text extraction is not available yet.",
      text: "",
      contentType,
    };
  }
  const html = await res.text();
  return parseHtmlSource(res.url || url, html, contentType);
}

function pushUnique(arr: string[], value: string): void {
  const v = value.trim();
  if (!v) return;
  if (!arr.some((x) => x.toLowerCase() === v.toLowerCase())) arr.push(v);
}

export async function enrichFactsWithLinks(
  facts: ExtractedProfileFacts,
  intake: IntakeData,
): Promise<LinkExtractionResult> {
  const urls = extractUrlsFromText(
    [
      intakeTextForUrlScan(intake),
      facts.links.join("\n"),
      facts.rawUsefulText.join("\n"),
    ].join("\n"),
  );
  const logs: string[] = [`linkExtraction: detected ${urls.length} URL(s)`];
  if (!urls.length) return { facts, logs };

  const next: ExtractedProfileFacts = {
    ...facts,
    links: [...facts.links],
    rawUsefulText: [...facts.rawUsefulText],
    notableClaims: [...facts.notableClaims],
  };

  for (const url of urls) {
    pushUnique(next.links, url);
    try {
      const source = await fetchLinkSource(url);
      pushUnique(next.rawUsefulText, sourceNote(source));
      if (source.title) pushUnique(next.notableClaims, `Linked source: ${source.title}`);
      logs.push(`linkExtraction: fetched ${url}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logs.push(`linkExtraction: skipped ${url} (${message})`);
    }
  }

  return { facts: next, logs };
}
