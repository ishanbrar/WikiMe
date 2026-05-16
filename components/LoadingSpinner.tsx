export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`loading-spinner inline-block shrink-0 ${className}`}
      role="status"
      aria-hidden="true"
    />
  );
}
