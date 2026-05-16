"use client";

import type { IntakeData } from "@/types/article";
import { IntakeForm } from "@/components/IntakeForm";
import { MobileIntakeWizard } from "@/components/intake/MobileIntakeWizard";
import { useIsMobile } from "@/hooks/useIsMobile";

export function IntakeFlow({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: IntakeData;
  onChange: (v: IntakeData) => void;
  onComplete: () => void;
  disabled?: boolean;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileIntakeWizard
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        disabled={disabled}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">About you</h1>
      <p className="text-slate-600 text-sm mb-6">
        Your browser can autofill name, city, and work details from saved info.
      </p>
      <form autoComplete="on" onSubmit={(e) => e.preventDefault()}>
        <fieldset disabled={disabled} className="border-0 p-0 m-0 min-w-0">
          <IntakeForm value={value} onChange={onChange} />
        </fieldset>
      </form>
      <button
        type="button"
        className="btn-primary mt-8"
        onClick={onComplete}
        disabled={disabled || !value.fullName.trim()}
      >
        Continue to uploads
      </button>
    </div>
  );
}
