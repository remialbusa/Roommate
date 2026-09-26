import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { COLORS } from "../theme";

export default function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // Focus the dialog for keyboard users.
    const t = setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.18s_ease-out]"
      style={{ backgroundColor: "rgba(12,34,27,0.55)" }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-sm rounded-3xl p-6 max-h-[85vh] overflow-y-auto app-scroll outline-none animate-[popIn_0.2s_ease-out]"
        style={{ backgroundColor: COLORS.creamCard, boxShadow: "0 24px 64px rgba(12,34,27,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 gap-3">
          <h2 className="font-display font-bold text-[18px] truncate" style={{ color: COLORS.ink }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: "rgba(18,49,40,0.08)" }}
            aria-label="Close dialog"
          >
            <X size={16} color={COLORS.ink} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
