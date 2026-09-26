import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import ScreenHeader from "../../components/ScreenHeader";
import ProgressGauge from "../../components/ProgressGauge";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { useMoney, loanRemaining } from "../../utils/format";
import LoanRow from "./LoanRow";

export default function Balances({ onBack, onOpenLoan }) {
  const { state, actions, currentUser } = useAppState();
  const { money } = useMoney();
  const { loans, users } = state;
  const [toast, setToast] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const totalLent = loans.reduce((s, l) => s + Number(l.amount || 0), 0);
  const settled = loans.reduce((s, l) => s + (Number(l.amount || 0) - loanRemaining(l)), 0);
  const pct = totalLent > 0 ? Math.min(100, Math.round((settled / totalLent) * 100)) : 0;
  const youreOwed = loans
    .filter((l) => l.direction === "owedToYou")
    .slice()
    .sort((a, b) => loanRemaining(b) - loanRemaining(a));
  const youOwe = loans
    .filter((l) => l.direction === "youOwe")
    .slice()
    .sort((a, b) => loanRemaining(b) - loanRemaining(a));
  const youreOwedTotal = youreOwed.reduce((s, l) => s + loanRemaining(l), 0);
  const youOweTotal = youOwe.reduce((s, l) => s + loanRemaining(l), 0);
  const unsettled = loans.filter((l) => loanRemaining(l) > 0);

  function sendReminder() {
    if (unsettled.length === 0) return;
    if (state.settings?.logReminders !== false) actions.logActivity({
      roommate: currentUser.id,
      category: "lending",
      action: unsettled.length === 1 ? `sent a reminder about the “${unsettled[0].title}” loan` : `sent a reminder about ${unsettled.length} open loans`,
    });
    setToast(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 1800);
  }

  return (
    <div className="rounded-[32px] p-6 pb-8 flex flex-col gap-5" style={{ backgroundColor: COLORS.ink }}>
      <ScreenHeader title="Balances" onBack={onBack} dark />

      <div className="rounded-3xl p-6 pb-5" style={{ background: `linear-gradient(180deg, ${COLORS.limeLight} 0%, ${COLORS.limeDark} 100%)` }}>
        <h2 className="font-display font-bold text-[20px] mb-2" style={{ color: COLORS.ink }}>
          Settled Overall
        </h2>
        <ProgressGauge percent={pct} />
        <div className="flex items-end justify-between -mt-2 gap-2">
          <span className="font-display font-bold text-[20px]" style={{ color: COLORS.ink }}>
            {money(settled)}
            <span className="font-body font-medium text-[15px] opacity-70"> / {money(totalLent)}</span>
          </span>
          <span className="font-display font-bold text-[26px]" style={{ color: COLORS.ink }}>
            {pct}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-semibold text-[15px]" style={{ color: COLORS.lime }}>
            You're Owed
          </h3>
          <span className="font-display font-bold text-[15px]" style={{ color: "#F1ECDC" }}>
            {money(youreOwedTotal)}
          </span>
        </div>
        {youreOwed.map((l, i) => (
          <LoanRow key={l.id} loan={l} person={users[l.roommate]} index={i} onOpen={() => onOpenLoan(l.id)} />
        ))}
        {youreOwed.length === 0 && (
          <p className="font-body text-[13px] px-1" style={{ color: "rgba(241,236,220,0.4)" }}>
            Nobody owes you right now.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-semibold text-[15px]" style={{ color: COLORS.ember }}>
            You Owe
          </h3>
          <span className="font-display font-bold text-[15px]" style={{ color: "#F1ECDC" }}>
            {money(youOweTotal)}
          </span>
        </div>
        {youOwe.map((l, i) => (
          <LoanRow key={l.id} loan={l} person={users[l.roommate]} index={i} onOpen={() => onOpenLoan(l.id)} />
        ))}
        {youOwe.length === 0 && (
          <p className="font-body text-[13px] px-1" style={{ color: "rgba(241,236,220,0.4)" }}>
            You don't owe anyone right now.
          </p>
        )}
      </div>

      <div className="rounded-2xl p-5 flex items-center justify-between gap-3 relative" style={{ backgroundColor: unsettled.length === 0 ? "rgba(241,236,220,0.06)" : COLORS.ember }}>
        <div className="pr-1 flex-1">
          <h3 className="font-display font-bold text-[16px] mb-1" style={{ color: "#F1ECDC" }}>
            Reminders
          </h3>
          <p className="font-body text-[12.5px] leading-snug" style={{ color: "rgba(241,236,220,0.85)" }}>
            {unsettled.length === 0
              ? "All loans are settled right now."
              : unsettled.length === 1
                ? `There's still an open balance on "${unsettled[0].title}". Nudges are logged in Activity.`
                : `${unsettled.length} loans still have an open balance. Nudges are logged in Activity.`}
          </p>
        </div>
        <button
          onClick={sendReminder}
          disabled={unsettled.length === 0}
          className="h-11 px-4 rounded-full flex items-center gap-1.5 shrink-0 font-body font-semibold text-[13px] transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: unsettled.length === 0 ? "rgba(241,236,220,0.1)" : COLORS.inkDeep, color: "#F1ECDC" }}
          aria-label="Log a reminder in Activity"
        >
          <Bell size={15} color="#F1ECDC" />
          Nudge
        </button>
        {toast && (
          <span className="anim-toast-r absolute -top-4 right-5 whitespace-nowrap text-[11px] font-body font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS.inkDeep, color: "#F1ECDC" }} role="status">
            Reminder logged
          </span>
        )}
      </div>
    </div>
  );
}
