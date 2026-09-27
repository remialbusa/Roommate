import { useState, useRef, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import ProgressGauge from "../../components/ProgressGauge";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { loanRemaining, loanStatus, useMoney } from "../../utils/format";
import LoanRow from "./LoanRow";

export default function Balances({ onBack, onOpenLoan, initialMember = "All" }) {
  const { state, actions, currentUser } = useAppState();
  const { loans, users } = state;
  const { money } = useMoney();
  const [memberFilter, setMemberFilter] = useState(initialMember);
  const [toast, setToast] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const confirmed = loans.filter((l) => loanStatus(l) === "confirmed");
  const pending = loans.filter((l) => loanStatus(l) === "pending");
  const declined = loans.filter((l) => loanStatus(l) === "declined");
  const inFilter = (l) => memberFilter === "All" || l.roommate === memberFilter;

  const totalLent = confirmed.reduce((s, l) => s + Number(l.amount || 0), 0);
  const settled = confirmed.reduce((s, l) => s + (Number(l.amount || 0) - loanRemaining(l)), 0);
  const pct = totalLent > 0 ? Math.min(100, Math.round((settled / totalLent) * 100)) : 0;
  const youreOwed = confirmed
    .filter((l) => l.direction === "owedToYou" && inFilter(l))
    .slice()
    .sort((a, b) => loanRemaining(b) - loanRemaining(a));
  const youOwe = confirmed
    .filter((l) => l.direction === "youOwe" && inFilter(l))
    .slice()
    .sort((a, b) => loanRemaining(b) - loanRemaining(a));
  const youreOwedTotal = confirmed.filter((l) => l.direction === "owedToYou").reduce((s, l) => s + loanRemaining(l), 0);
  const youOweTotal = confirmed.filter((l) => l.direction === "youOwe").reduce((s, l) => s + loanRemaining(l), 0);
  const unsettled = confirmed.filter((l) => loanRemaining(l) > 0);
  const visiblePending = pending.filter(inFilter);
  const visibleDeclined = declined.filter(inFilter);
  const memberIds = [...new Set(confirmed.concat(pending).map((l) => l.roommate))].filter((id) => users[id]);

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

  function confirmLabel(l) {
    // From your view: loans you created wait on them, the rest wait on you.
    if (l.createdBy && l.createdBy === currentUser?.id) {
      const other = users[l.roommate];
      return `Waiting for ${other?.name?.split(" ")[0] ?? "them"} to confirm`;
    }
    return "Waiting for you to confirm";
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

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 app-scroll" role="group" aria-label="Filter by member">
        {["All", ...memberIds].map((id) => (
          <button
            key={id}
            onClick={() => setMemberFilter(id)}
            aria-pressed={memberFilter === id}
            className="px-4 py-2 rounded-full font-body font-semibold text-[13px] shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
            style={{ backgroundColor: memberFilter === id ? COLORS.lime : "rgba(241,236,220,0.08)", color: memberFilter === id ? COLORS.ink : "rgba(241,236,220,0.7)" }}
          >
            {id === "All" ? "All" : users[id]?.name?.split(" ")[0] ?? "Unknown"}
          </button>
        ))}
      </div>

      {visiblePending.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display font-semibold text-[15px] px-1" style={{ color: COLORS.gold }}>
            Awaiting confirmation · {visiblePending.length}
          </h3>
          {visiblePending.map((l, i) => {
            const person = users[l.roommate];
            const mine = l.createdBy && l.createdBy === currentUser?.id;
            return (
              <div
                key={l.id}
                className="anim-item rounded-2xl p-4 flex items-center gap-3"
                style={{ backgroundColor: "rgba(240,185,11,0.1)", border: "1.5px solid rgba(240,185,11,0.4)", animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <Avatar bg={person?.bg} name={person?.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
                    {l.title}
                  </div>
                  <div className="font-body text-[12px] truncate" style={{ color: "rgba(241,236,220,0.5)" }}>
                    {money(l.amount)} · {confirmLabel(l)}
                  </div>
                </div>
                {mine ? (
                  <button
                    onClick={() => actions.deleteLoan(l.id, currentUser.id)}
                    className="shrink-0 px-3.5 py-2.5 rounded-xl font-body font-bold text-[13px]"
                    style={{ backgroundColor: "transparent", border: "1.5px solid rgba(241,236,220,0.3)", color: "#F1ECDC" }}
                  >
                    Cancel
                  </button>
                ) : (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => actions.declineLoan(l.id, currentUser.id)}
                      aria-label={`Decline ${l.title}`}
                      className="h-10 w-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                      style={{ backgroundColor: "rgba(241,236,220,0.1)", color: "#F1ECDC" }}
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => actions.confirmLoan(l.id, currentUser.id)}
                      aria-label={`Confirm ${l.title}`}
                      className="h-10 px-4 rounded-full flex items-center gap-1 font-body font-bold text-[13px] transition-transform active:scale-95"
                      style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
                    >
                      <Check size={15} />
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {visibleDeclined.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display font-semibold text-[15px] px-1" style={{ color: "rgba(241,236,220,0.4)" }}>
            Declined
          </h3>
          {visibleDeclined.map((l) => (
            <LoanRow key={l.id} loan={l} person={users[l.roommate]} onOpen={() => onOpenLoan(l.id)} />
          ))}
        </div>
      )}

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
