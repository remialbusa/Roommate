import Logo from "./Logo";
import { COLORS } from "../theme";
import { useAppState } from "../state/AppStateContext";

/** Boot gate: shown while the session/household loads, or when the
 *  server is unreachable (with a retry). */
export default function Splash() {
  const { actions, bootError } = useAppState();
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ backgroundColor: COLORS.cream }}>
      <div className="flex flex-col items-center gap-4">
        <div className="anim-screen flex items-center gap-2.5">
          <Logo />
          <span className="font-display font-bold text-[20px]" style={{ color: COLORS.ink }}>
            Roomie
          </span>
        </div>
        {bootError ? (
          <div className="w-full max-w-xs rounded-2xl p-5 text-center" style={{ backgroundColor: COLORS.creamCard }}>
            <p className="font-body text-[13.5px] mb-4" style={{ color: COLORS.ink }} role="alert">
              {bootError}
            </p>
            <button
              onClick={() => actions.retryBoot()}
              className="w-full rounded-xl py-3 font-body font-semibold text-[14px] transition-transform active:scale-[0.98]"
              style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="anim-item h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS.ink, opacity: 0.5, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
