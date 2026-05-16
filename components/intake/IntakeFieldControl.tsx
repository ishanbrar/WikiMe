"use client";

import type { IntakeData } from "@/types/article";
import type { IntakeFieldDef } from "@/lib/intakeFields";
import { applyFullNameChange } from "@/lib/intakeSync";

export function IntakeFieldControl({
  field,
  value,
  onChange,
  autoFocus,
  id,
}: {
  field: IntakeFieldDef;
  value: IntakeData;
  onChange: (v: IntakeData) => void;
  autoFocus?: boolean;
  id?: string;
}) {
  const val = String(value[field.key] ?? "");
  const inputId = id ?? `intake-${field.key}`;

  const setVal = (next: string) => {
    if (field.key === "fullName") {
      onChange(applyFullNameChange(value, next));
      return;
    }
    onChange({ ...value, [field.key]: next } as IntakeData);
  };

  const common = {
    id: inputId,
    name: field.name ?? field.key,
    autoComplete: field.autocomplete ?? "on",
    autoCapitalize: "words" as const,
    autoCorrect: "on" as const,
    enterKeyHint: "next" as const,
    placeholder: field.placeholder,
    className: "intake-mobile-input",
    value: val,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setVal(e.target.value),
    autoFocus,
  };

  if (field.textarea) {
    return (
      <label className="block w-full" htmlFor={inputId}>
        <span className="sr-only">{field.label}</span>
        <textarea {...common} rows={4} className="intake-mobile-input min-h-[120px]" />
      </label>
    );
  }

  return (
    <label className="block w-full" htmlFor={inputId}>
      <span className="sr-only">{field.label}</span>
      <input
        {...common}
        type="text"
        inputMode={field.inputMode ?? "text"}
      />
    </label>
  );
}
