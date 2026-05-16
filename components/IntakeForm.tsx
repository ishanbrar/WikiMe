"use client";

import { Fragment } from "react";
import type { ArticleLength, ArticleMode, IntakeData, TonePreference } from "@/types/article";
import { ModeSelector } from "@/components/ModeSelector";
import type { IntakeFieldDef } from "@/lib/intakeFields";
import { TONE_OPTIONS, LENGTH_OPTIONS } from "@/lib/intakeFields";
import { applyFullNameChange } from "@/lib/intakeSync";

const defaultIntake = (mode: ArticleMode = "realism"): IntakeData => ({
  fullName: "",
  articleTitle: "",
  birthplace: "",
  currentLocation: "",
  education: "",
  occupation: "",
  currentRole: "",
  notableProjects: "",
  achievements: "",
  skills: "",
  interests: "",
  lifeEvents: "",
  tone: "neutral",
  mode,
  extraNotes: "",
  pastedProfileText: "",
  articleLength: "standard",
});

export function createDefaultIntake(mode?: ArticleMode) {
  return defaultIntake(mode);
}

const DESKTOP_FIELDS: {
  label: string;
  key: keyof IntakeData;
  opts?: Partial<IntakeFieldDef> & { textarea?: boolean; required?: boolean };
}[] = [
  { label: "Full name", key: "fullName", opts: { required: true, autocomplete: "name", name: "name" } },
  { label: "Article title", key: "articleTitle", opts: { required: true, autocomplete: "nickname", name: "nickname" } },
  { label: "Birthplace / hometown", key: "birthplace", opts: { autocomplete: "birthplace", name: "birthplace" } },
  { label: "Current location", key: "currentLocation", opts: { autocomplete: "address-level2", name: "address-level2" } },
  { label: "Education", key: "education", opts: { autocomplete: "organization", name: "organization" } },
  { label: "Occupation / field", key: "occupation", opts: { autocomplete: "organization-title", name: "organization-title" } },
  { label: "Current role", key: "currentRole", opts: { autocomplete: "organization-title", name: "job-title" } },
];

export function IntakeForm({
  value,
  onChange,
}: {
  value: IntakeData;
  onChange: (v: IntakeData) => void;
}) {
  const set = <K extends keyof IntakeData>(key: K, val: IntakeData[K]) =>
    onChange({ ...value, [key]: val });

  const field = (
    label: string,
    key: keyof IntakeData,
    opts?: {
      textarea?: boolean;
      required?: boolean;
      autocomplete?: string;
      name?: string;
    },
  ) => (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {opts?.required && " *"}
      </span>
      {opts?.textarea ? (
        <textarea
          className="form-input mt-1 min-h-[80px]"
          name={opts.name ?? String(key)}
          autoComplete={opts.autocomplete ?? "on"}
          value={String(value[key])}
          onChange={(e) => set(key, e.target.value as IntakeData[typeof key])}
        />
      ) : (
        <input
          className="form-input mt-1"
          type="text"
          name={opts?.name ?? String(key)}
          autoComplete={opts?.autocomplete ?? "on"}
          value={String(value[key])}
          onChange={(e) => {
            if (key === "fullName") {
              onChange(applyFullNameChange(value, e.target.value));
              return;
            }
            onChange({ ...value, [key]: e.target.value } as IntakeData);
          }}
        />
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      <ModeSelector value={value.mode} onChange={(m) => set("mode", m)} />

      <div className="grid md:grid-cols-2 gap-4">
        {DESKTOP_FIELDS.map((f) => (
          <Fragment key={f.key}>{field(f.label, f.key, f.opts)}</Fragment>
        ))}
      </div>

      {field("Notable projects", "notableProjects", { textarea: true, autocomplete: "off" })}
      {field("Achievements", "achievements", { textarea: true, autocomplete: "off" })}
      {field("Skills", "skills", { autocomplete: "off" })}
      {field("Interests", "interests", { autocomplete: "off" })}
      {field("Important life events", "lifeEvents", { textarea: true, autocomplete: "off" })}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Tone preference</span>
        <select
          className="form-input mt-1"
          name="tone"
          autoComplete="off"
          value={value.tone}
          onChange={(e) => set("tone", e.target.value as TonePreference)}
        >
          {TONE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Article length</span>
        <select
          className="form-input mt-1"
          name="article-length"
          autoComplete="off"
          value={value.articleLength}
          onChange={(e) => set("articleLength", e.target.value as ArticleLength)}
        >
          {LENGTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {field("Extra notes", "extraNotes", { textarea: true, autocomplete: "off" })}
      {field("Pasted profile text (LinkedIn, resume, etc.)", "pastedProfileText", {
        textarea: true,
        autocomplete: "off",
      })}
    </div>
  );
}
