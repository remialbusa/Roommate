import { useState, useRef, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { COLORS } from "../theme";

/* ---------------------------------------------------------------
   One button language for the whole app:
   - primary   lime fill — the single "create / save" action
   - gold      gold fill — the screen's signature tool (split, log)
   - secondary cream fill — navigation to another screen
   - ghost     transparent + border — low-stakes side actions
   - danger    ember outline idle → solid ember armed (deletes)
   Every tile carries a short hint line so the button says what it
   actually does, not just a noun.
----------------------------------------------------------------- */

const TILE_STYLES = {
  primary: { bg: COLORS.lime, fg: COLORS.ink, border: "none" },
  gold: { bg: COLORS.gold, fg: COLORS.ink, border: "none" },
  secondary: { bg: COLORS.creamCard, fg: COLORS.ink, border: "none" },
  ghost: { bg: "transparent", fg: COLORS.ink, border: `1.5px solid rgba(18,49,40,0.25)` },
};

export function ActionTile({ icon, label, hint, variant = "secondary", onClick, disabled, ariaLabel }) {
  const s = TILE_STYLES[variant] || TILE_STYLES.secondary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      className="rounded-2xl py-5 px-3 flex flex-col items-center gap-1.5 transition-transform active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FE84F]"
      style={{ backgroundColor: s.bg, color: s.fg, border: s.border }}
    >
      {icon}
      <span className="font-body font-semibold text-[15px] leading-tight">{label}</span>
      {hint && (
        <span className="font-body text-[11.5px] leading-tight" style={{ opacity: 0.6 }}>
          {hint}
        </span>
      )}
    </button>
  );
}

export function SummaryCard({ title, status, amount, caption, extra, linkLabel, onLink }) {
  return (
    <div className="rounded-2xl p-5 text-left" style={{ backgroundColor: COLORS.gold }}>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="font-body font-semibold text-[15px]" style={{ color: COLORS.ink }}>
          {title}
        </span>
        <span className="font-body font-semibold text-[15px]" style={{ color: COLORS.ember }}>
          {status}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-display font-bold text-[40px] leading-none" style={{ color: COLORS.ink }}>
          {amount}
        </span>
        {extra}
      </div>
      <div className="font-body text-[13px] mt-1" style={{ color: "rgba(18,49,40,0.7)" }}>
        {caption}
      </div>
      {onLink && (
        <button
          onClick={onLink}
          className="mt-3 font-body font-bold text-[13.5px] underline underline-offset-4 decoration-2 focus-visible:outline-2 focus-visible:outline-[#123128] rounded"
          style={{ color: COLORS.ink }}
        >
          {linkLabel} →
        </button>
      )}
    </div>
  );
}

export function DeleteButton({ label = "Delete", onDelete, dark = false }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  function disarm() {
    setArmed(false);
    clearTimeout(timer.current);
  }

  function handleMain() {
    if (!armed) {
      setArmed(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    onDelete();
  }

  if (!armed) {
    return (
      <button
        onClick={handleMain}
        className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-body font-semibold text-[13.5px] transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#F0492A]"
        style={{
          backgroundColor: "transparent",
          color: dark ? COLORS.ember : COLORS.ink,
          border: `1.5px solid ${dark ? "rgba(240,73,42,0.55)" : "rgba(18,49,40,0.25)"}`,
        }}
      >
        <Trash2 size={15} color={dark ? COLORS.ember : COLORS.ink} />
        {label}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <button
        onClick={handleMain}
        className="rounded-2xl py-4 flex items-center justify-center gap-2 font-body font-semibold text-[13.5px] transition-transform active:scale-[0.98]"
        style={{ backgroundColor: COLORS.ember, color: "#F1ECDC" }}
      >
        <Trash2 size={15} />
        Confirm delete
      </button>
      <button
        onClick={disarm}
        aria-label="Cancel delete"
        className="rounded-2xl px-4 flex items-center justify-center font-body font-semibold text-[13.5px]"
        style={{ backgroundColor: dark ? "rgba(241,236,220,0.1)" : "rgba(18,49,40,0.08)", color: dark ? "#F1ECDC" : COLORS.ink }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
