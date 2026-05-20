"use client";

import { Fragment } from "react";
import type { ArticleLength, ArticleMode, IntakeData, TonePreference } from "@/types/article";
import { ModeSelector } from "@/components/ModeSelector";
import type { IntakeFieldDef, IntakeFieldKey } from "@/lib/intakeFields";
import { INTAKE_PLACEHOLDERS, TONE_OPTIONS, LENGTH_OPTIONS } from "@/lib/intakeFields";
import { applyFullNameChange } from "@/lib/intakeSync";
import { IntakeRequiredNote } from "@/components/intake/IntakeRequiredNote";

const defaultIntake = (mode: ArticleMode = "realism"): IntakeData => ({
  fullName: "",
  articleTitle: "",
  birthplace: "",
  birthday: "",
  deathDate: "",
  currentLocation: "",
  education: "",
  occupation: "",
  achievements: "",
  lifeEvents: "",
  controversies: "",
  tone: "neutral",
  mode,
  extraNotes: "",
  pastedProfileText: "",
  articleLength: "standard",
});

export function createDefaultIntake(mode?: ArticleMode) {
  return defaultIntake(mode);
}

const REQUIRED_FIELDS: {
  label: string;
  key: IntakeFieldKey;
  opts?: Partial<IntakeFieldDef> & { textarea?: boolean; required?: boolean };
}[] = [
  { label: "Full name", key: "fullName", opts: { required: true, autocomplete: "name", name: "name" } },
  {
    label: "Article title",
    key: "articleTitle",
    opts: { required: true, autocomplete: "nickname", name: "nickname" },
  },
];

const OPTIONAL_GRID_FIELDS: typeof REQUIRED_FIELDS = [
  { label: "Birthplace / hometown", key: "birthplace", opts: { autocomplete: "birthplace", name: "birthplace" } },
  { label: "Birthday", key: "birthday", opts: { autocomplete: "bday", name: "bday" } },
  { label: "Death date (if applicable)", key: "deathDate", opts: { autocomplete: "off" } },
  { label: "Current location", key: "currentLocation", opts: { autocomplete: "address-level2", name: "address-level2" } },
  { label: "Education", key: "education", opts: { autocomplete: "organization", name: "organization" } },
  {
    label: "Occupation / role",
    key: "occupation",
    opts: { autocomplete: "organization-title", name: "organization-title" },
  },
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
    key: IntakeFieldKey,
    opts?: {
      textarea?: boolean;
      required?: boolean;
      autocomplete?: string;
      name?: string;
      placeholder?: string;
    },
  ) => (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {opts?.required ? " *" : null}
        {!opts?.required ? (
          <span className="intake-field-optional-tag"> (optional)</span>
        ) : null}
      </span>
      {opts?.textarea ? (
        <textarea
          className="form-input mt-1 min-h-[80px]"
          name={opts.name ?? String(key)}
          autoComplete={opts.autocomplete ?? "on"}
          placeholder={opts.placeholder ?? INTAKE_PLACEHOLDERS[key]}
          value={String(value[key])}
          onChange={(e) => set(key, e.target.value as IntakeData[typeof key])}
        />
      ) : (
        <input
          className="form-input mt-1"
          type="text"
          name={opts?.name ?? String(key)}
          autoComplete={opts?.autocomplete ?? "on"}
          placeholder={opts?.placeholder ?? INTAKE_PLACEHOLDERS[key]}
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

  const creativeActive = value.mode === "creative";

  return (
    <div
      className={`space-y-6 intake-form${creativeActive ? " intake-form--creative" : ""}`}
    >
      <ModeSelector value={value.mode} onChange={(m) => set("mode", m)} />

      <IntakeRequiredNote />

      <section
        className="intake-section intake-section--required"
        aria-labelledby="intake-required-heading"
      >
        <h2
          id="intake-required-heading"
          className="intake-section-heading intake-section-heading--required"
        >
          Required
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {REQUIRED_FIELDS.map((f) => (
            <Fragment key={f.key}>{field(f.label, f.key, f.opts)}</Fragment>
          ))}
        </div>
      </section>

      <section
        className="intake-section intake-section--optional"
        aria-labelledby="intake-optional-heading"
      >
        <h2 id="intake-optional-heading" className="intake-section-heading">
          Optional details
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {OPTIONAL_GRID_FIELDS.map((f) => (
            <Fragment key={f.key}>{field(f.label, f.key, f.opts)}</Fragment>
          ))}
        </div>

        {field("Achievements & skills", "achievements", {
          textarea: true,
          autocomplete: "off",
        })}
        {field("Important life events", "lifeEvents", { textarea: true, autocomplete: "off" })}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Tone preference
            <span className="intake-field-optional-tag"> (optional)</span>
          </span>
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
          <span className="text-sm font-medium text-slate-700">
            Article length
            <span className="intake-field-optional-tag"> (optional)</span>
          </span>
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
      </section>
    </div>
  );
}
