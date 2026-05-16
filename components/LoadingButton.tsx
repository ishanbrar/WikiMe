import { LoadingSpinner } from "@/components/LoadingSpinner";

export function LoadingButton({
  loading,
  children,
  loadingLabel,
  className = "btn-primary",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      className={`${className} inline-flex items-center justify-center gap-2`}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      <span>{loading ? loadingLabel ?? children : children}</span>
    </button>
  );
}
