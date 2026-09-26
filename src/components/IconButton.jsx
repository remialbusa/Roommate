import { COLORS } from "../theme";

const TONE_STYLES = {
  cream: { bg: COLORS.creamCard, fg: COLORS.ink },
  dark: { bg: "rgba(255,255,255,0.12)", fg: "#F1ECDC" },
  lime: { bg: COLORS.lime, fg: COLORS.ink },
  ember: { bg: COLORS.ember, fg: "#F1ECDC" },
};

export default function IconButton({ icon, onClick, tone = "cream", ariaLabel, disabled }) {
  const { bg, fg } = TONE_STYLES[tone] || TONE_STYLES.cream;
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FE84F] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: bg, color: fg }}
    >
      {icon}
    </button>
  );
}
