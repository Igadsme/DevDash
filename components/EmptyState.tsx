"use client";

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className="rounded-xl px-6 py-10 text-center"
      style={{ background: "#111116", border: "1px solid #1e1e26" }}
    >
      <div className="text-sm font-semibold mb-1" style={{ color: "#f0f0f2" }}>
        {title}
      </div>
      <p className="text-sm mb-4" style={{ color: "#6b6b80" }}>
        {body}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs px-3 py-1.5 rounded-md"
          style={{ background: "#4a8fff", color: "#fff" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="rounded-xl px-6 py-8 text-center"
      style={{ background: "#1a0f0f", border: "1px solid #2a1515" }}
    >
      <div className="text-sm mb-3" style={{ color: "#ef4444" }}>
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-3 py-1.5 rounded-md"
          style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
