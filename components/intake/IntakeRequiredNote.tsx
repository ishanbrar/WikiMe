export function IntakeRequiredNote({ className = "" }: { className?: string }) {
  return (
    <p className={`intake-required-note ${className}`.trim()}>
      Only your <strong>full name</strong> and <strong>article title</strong> are required.
      Everything else is optional and helps your article read more like Wikipedia.
    </p>
  );
}
