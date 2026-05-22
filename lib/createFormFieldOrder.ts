import type { IntakeFieldKey } from "@/lib/intakeFields";
import { BASICS_FIELDS, BIO_FIELDS, MORE_FIELDS, SOCIAL_FIELDS } from "@/lib/createFormTabs";

/** Tab order for single-line fields and textareas on the create form. */
export const CREATE_FORM_FIELD_ORDER: IntakeFieldKey[] = [
  ...BASICS_FIELDS.map((f) => f.key),
  ...BIO_FIELDS.map((f) => f.key),
  ...SOCIAL_FIELDS.map((f) => f.key),
  ...MORE_FIELDS.map((f) => f.key),
];

export function createFieldDomId(key: IntakeFieldKey): string {
  return `create-${key}`;
}

export function focusCreateField(key: IntakeFieldKey): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(createFieldDomId(key));
  if (!el || "disabled" in el && (el as HTMLInputElement).disabled) return false;
  el.focus({ preventScroll: false });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }
  return true;
}

/** Move focus to the next intake field, or the generate button after the last field. */
export function focusNextCreateField(currentKey: IntakeFieldKey): void {
  const order = CREATE_FORM_FIELD_ORDER;
  const idx = order.indexOf(currentKey);
  if (idx === -1) return;

  for (let i = idx + 1; i < order.length; i++) {
    if (focusCreateField(order[i])) return;
  }

  const generateBtn = document.querySelector<HTMLButtonElement>(
    ".create-flow-generate-btn:not(:disabled)",
  );
  generateBtn?.focus();
}
