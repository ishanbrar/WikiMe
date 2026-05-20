"use client";

import type { IntakeData } from "@/types/article";
import type { IntakeFieldDef } from "@/lib/intakeFields";
import { INTAKE_PLACEHOLDERS } from "@/lib/intakeFields";
import { applyFullNameChange } from "@/lib/intakeSync";

export function IntakeFieldsGrid({
  fields,
  value,
  onChange,
  columns = 2,
}: {
  fields: IntakeFieldDef[];
  value: IntakeData;
  onChange: (v: IntakeData) => void;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={
        columns === 1
          ? "flex flex-col gap-4"
          : "grid gap-4 sm:grid-cols-2"
      }
    >
      {fields.map((f) => (
        <IntakeFieldRow key={f.key} field={f} value={value} onChange={onChange} />
      ))}
    </div>
  );
}

function IntakeFieldRow({
  field,
  value,
  onChange,
}: {
  field: IntakeFieldDef;
  value: IntakeData;
  onChange: (v: IntakeData) => void;
}) {
  const val = String(value[field.key] ?? "");
  const spanFull = field.textarea;

  const setVal = (next: string) => {
    if (field.key === "fullName") {
      onChange(applyFullNameChange(value, next));
      return;
    }
    onChange({ ...value, [field.key]: next } as IntakeData);
  };

  const common = {
    id: `create-${field.key}`,
    name: field.name ?? field.key,
    autoComplete: field.autocomplete ?? "on",
    placeholder: field.placeholder ?? INTAKE_PLACEHOLDERS[field.key],
    className: "form-input mt-1 w-full",
    value: val,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setVal(e.target.value),
  };

  return (
    <label
      className={`block ${spanFull ? "sm:col-span-2" : ""}`}
      htmlFor={common.id}
    >
      <span className="text-sm font-medium text-slate-700">
        {field.label}
        {field.required ? " *" : null}
        {!field.required ? (
          <span className="intake-field-optional-tag"> (optional)</span>
        ) : null}
      </span>
      {field.textarea ? (
        <textarea {...common} rows={4} className="form-input mt-1 w-full min-h-[100px]" />
      ) : (
        <input {...common} type="text" inputMode={field.inputMode ?? "text"} />
      )}
    </label>
  );
}
