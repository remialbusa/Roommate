import { useEffect, useState } from "react";
import Logo from "./Logo";
import Avatar from "./Avatar";
import BackgroundTexture from "./BackgroundTexture";
import BottomNav from "./BottomNav";
import { NAV_TABS } from "./navTabs";
import { COLORS } from "../theme";
import { useAppState } from "../state/AppStateContext";

/**
 * Single source of truth for which shell is active, kept in sync
 * with Tailwind's md breakpoint (768px). The inactive shell is
 * removed from the DOM entirely — not just CSS-hidden — so the
 * mobile tab bar can never appear on desktop (or vice versa),
 * even with stale cached CSS.
 */
function useDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    function onChange(e) {
      setDesktop(e.matches);
    }
    mq.addEventListener("change", onChange);
    setDesktop(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

/**
 * The responsive web app shell. Mobile: edge-to-edge content with a
 * bottom tab bar. Desktop (md+): a persistent left sidebar for
 * navigation and a wider, page-scrolled content area — a real web
 * layout rather than a phone mockup floating on a big screen.
 */
export default function AppShell({ active, onChangeActive, children }) {
  const { currentUser, actions } = useAppState();
  const desktop = useDesktop();

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundColor: COLORS.cream }}>
      <BackgroundTexture />

      {desktop && (
        <aside
          className="anim-screen hidden md:flex md:flex-col w-64 shrink-0 p-6 gap-8 sticky top-0 h-screen"
          style={{ backgroundColor: COLORS.ink }}
        >
        <div className="flex items-center gap-2.5 px-1">
          <Logo />
          <span className="font-display font-bold text-[17px]" style={{ color: "#F1ECDC" }}>
            Roomie
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChangeActive(t.id)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-body font-semibold text-[14px] transition-colors"
                style={{
                  backgroundColor: isActive ? "rgba(143,232,79,0.15)" : "transparent",
                  color: isActive ? COLORS.lime : "rgba(241,236,220,0.6)",
                }}
              >
                <Icon size={18} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {currentUser && (
          <button
            onClick={actions.openSettings}
            className="mt-auto flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors hover:bg-white/5"
          >
            <Avatar bg={currentUser.bg} size={34} />
            <div className="text-left">
              <div className="font-body font-semibold text-[13px]" style={{ color: "#F1ECDC" }}>
                {currentUser.name}
              </div>
              <div className="font-body text-[11px]" style={{ color: "rgba(241,236,220,0.5)" }}>
                View household
              </div>
            </div>
          </button>
        )}
        </aside>
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <main className="flex-1 flex justify-center px-4 pt-4 pb-28 md:px-10 md:py-10">
          <div className="w-full max-w-[440px] md:max-w-2xl">{children}</div>
        </main>

        {!desktop && (
          <div className="md:hidden fixed bottom-0 inset-x-0 px-3 pt-2 bg-gradient-to-t from-[#E7E0CB] via-[#E7E0CB] to-transparent" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <BottomNav active={active} onChange={onChangeActive} />
          </div>
        )}
      </div>
    </div>
  );
}
