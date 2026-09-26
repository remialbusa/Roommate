import { COLORS } from "../theme";
import { NAV_TABS } from "./navTabs";

export default function BottomNav({ active, onChange }) {
  return (
    <nav aria-label="Primary" className="rounded-2xl p-2 flex items-center justify-between shrink-0" style={{ backgroundColor: COLORS.ink }}>
      {NAV_TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={isActive ? "page" : undefined}
            className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FE84F]"
            style={{ backgroundColor: isActive ? "rgba(143,232,79,0.22)" : "transparent" }}
          >
            <Icon size={18} color={isActive ? COLORS.lime : "rgba(241,236,220,0.55)"} />
            <span
              className="font-body font-semibold text-[10px] leading-none"
              style={{ color: isActive ? COLORS.lime : "rgba(241,236,220,0.55)" }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
