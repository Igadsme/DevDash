import { useEffect } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const config = {
  success: { icon: Check, color: "#22c55e", bg: "#0d1a0d", border: "#1a3a1a" },
  error: { icon: AlertCircle, color: "#ef4444", bg: "#1a0f0f", border: "#2a1515" },
  info: { icon: Info, color: "#4a8fff", bg: "#0d1a2d", border: "#1a3050" },
};

export default function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const c = config[type];

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm fade-in"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: "#f0f0f2", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
    >
      <c.icon size={14} style={{ color: c.color, flexShrink: 0 }} />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2"
        style={{ color: "#6b6b80" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
      >
        <X size={13} />
      </button>
    </div>
  );
}
