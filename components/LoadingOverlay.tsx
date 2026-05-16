import { LoadingSpinner } from "@/components/LoadingSpinner";

export function LoadingOverlay({
  message,
  subMessage,
}: {
  message: string;
  subMessage?: string;
}) {
  return (
    <div className="loading-overlay" role="alert" aria-live="polite" aria-busy={true}>
      <div className="loading-overlay-card">
        <LoadingSpinner className="loading-spinner-lg" />
        <p className="loading-overlay-message">{message}</p>
        {subMessage && <p className="loading-overlay-sub">{subMessage}</p>}
      </div>
    </div>
  );
}
