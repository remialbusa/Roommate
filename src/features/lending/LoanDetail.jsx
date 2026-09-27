import { useState, useRef, useEffect } from "react";
import { Bell, Coins, Pencil, Check, X } from "lucide-react";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { useMoney, loanRemaining, formatDateLabel } from "../../utils/format";
import { ActionTile, DeleteButton } from "../../components/actions";
import PayNowModal from "./PayNowModal";
import AddLoanModal from "./AddLoanModal";
import AttachmentsSection from "../../components/Attachments";

export default function LoanDetail({ loanId, onBack }) {
  const { state, actions, currentUser } = useAppState();
  const { money } = useMoney();
  const { users } = state;
  const loan = state.loans.find((l) => l.id === loanId);
  const [toast, setToast] = useState("");
  const [showPay, setShowPay] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!loan) {
    return (
      <div className="rounded-[32px] p-6" style={{ backgroundColor: COLORS.ink }}>
        <ScreenHeader title="Loan" onBack={onBack} dark />
        <p className="font-body text-[14px]" style={{ color: "#F1ECDC" }}>
          This loan no longer exists.
        </p>
      </div>
    );
  }

  const person = users[loan.roommate];
  const repaid = (loan.repayments || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  const remaining = loanRemaining(loan);
  const settled = remaining <= 0;
  const status = loan.status || "confirmed";
  const amCreator = Boolean(loan.createdBy && currentUser && loan.createdBy === currentUser.id);
  // Viewer-mapped loans show the creator as `roommate` exactly when the
  // viewer is the counterparty — the only other party who may confirm.
  const canConfirm = status === "pending" && Boolean(loan.createdBy) && loan.roommate === loan.createdBy;
  const canDelete = amCreator || !loan.createdBy || status !== "pending";
  const confirmerName = (users[loan.roommate]?.name ?? "roommate").split(" ")[0];
  // Only the creator settles the log (legacy loans stay shared).
  const canSettle = !loan.createdBy || (currentUser && loan.createdBy === currentUser.id);
  const creatorName = (users[loan.createdBy]?.name ?? "the creator").split(" ")[0];

  function flash(msg) {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 1800);
  }

  function sendReminder() {
    if (settled) return flash("Already settled — nothing to nudge.");
    if (state.settings?.logReminders !== false) actions.logActivity({ roommate: currentUser.id, category: "lending", action: `sent a reminder about the “${loan.title}” loan to ${(person?.name ?? "roommate").split(" ")[0]}` });
    flash("Reminder sent — logged in Activity");
  }

  return (
    <div className="rounded-[32px] overflow-hidden flex flex-col" style={{ backgroundColor: COLORS.creamCard }}>
      <div className="p-6 pb-7">
        <ScreenHeader
          title={loan.title}
          onBack={onBack}
          right={
            <button
              onClick={() => setShowEdit(true)}
              className="h-11 px-4 rounded-full flex items-center gap-1.5 transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: "#FFFFFF", border: "1.5px solid rgba(18,49,40,0.25)", color: COLORS.ink }}
            >
              <Pencil size={15} />
              <span className="font-body font-semibold text-[13px]">Edit</span>
            </button>
          }
        />
        <div className="flex flex-col items-center text-center">
          <Avatar bg={person?.bg} name={person?.name} size={76} />
          <h2 className="font-display font-bold text-[18px] mt-3 truncate max-w-full" style={{ color: COLORS.ink }}>
            {person?.name ?? "Unknown roommate"}
          </h2>
          <p className="font-body text-[13px] mt-0.5" style={{ color: "rgba(18,49,40,0.6)" }}>
            {money(loan.amount)} · {formatDateLabel(loan.loanDate) || loan.date} · {settled ? "Fully settled" : `${money(remaining)} remaining`}
          </p>
          <span
            className="mt-2 font-body font-semibold text-[11.5px] px-3 py-1 rounded-full"
            style={{ backgroundColor: loan.direction === "owedToYou" ? "rgba(143,232,79,0.3)" : "rgba(240,73,42,0.15)", color: COLORS.ink }}
          >
            {loan.direction === "owedToYou" ? "They owe you" : "You owe them"}
          </span>
          {loan.createdBy && users[loan.createdBy] && (
            <p className="font-body text-[12px] mt-1.5" style={{ color: "rgba(18,49,40,0.55)" }}>
              Logged by {users[loan.createdBy].name}
            </p>
          )}
        </div>

        {status !== "confirmed" && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-2.5"
            style={{
              backgroundColor: status === "pending" ? "rgba(240,185,11,0.12)" : "rgba(240,73,42,0.12)",
              border: `1.5px solid ${status === "pending" ? "rgba(240,185,11,0.45)" : "rgba(240,73,42,0.45)"}`,
            }}
            role="status"
          >
            <span className="font-body font-semibold text-[13px]" style={{ color: COLORS.ink }}>
              {status === "pending"
                ? canConfirm
                  ? "Waiting for you to confirm"
                  : `Waiting for ${confirmerName} to confirm`
                : `Declined${amCreator ? " — remove it or log a new one" : ""}`}
            </span>
          </div>
        )}

        {status === "pending" && canConfirm && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => actions.declineLoan(loan.id, currentUser.id)}
              className="rounded-2xl py-4 flex items-center justify-center gap-2 font-body font-semibold text-[14px] transition-transform active:scale-[0.97]"
              style={{ backgroundColor: "transparent", border: "1.5px solid rgba(18,49,40,0.25)", color: COLORS.ink }}
            >
              <X size={16} />
              Decline
            </button>
            <button
              onClick={() => actions.confirmLoan(loan.id, currentUser.id)}
              className="rounded-2xl py-4 flex items-center justify-center gap-2 font-body font-semibold text-[14px] transition-transform active:scale-[0.97]"
              style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
            >
              <Check size={16} />
              Confirm
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6 relative">
          <ActionTile
            icon={<Coins size={20} color={COLORS.ink} />}
            label={loan.direction === "owedToYou" ? "Log Repayment" : "Log Payment"}
            hint={settled ? "Fully settled" : status !== "confirmed" ? "Needs confirmation" : !canSettle ? `Only ${creatorName} settles` : `${money(remaining)} left`}
            variant="gold"
            onClick={() => setShowPay(true)}
            disabled={settled || status !== "confirmed" || !canSettle}
          />
          <ActionTile
            icon={<Bell size={20} color={COLORS.ink} />}
            label="Remind"
            hint={state.settings?.logReminders !== false ? "Logged in Activity" : "Toast only"}
            variant="ghost"
            onClick={sendReminder}
          />
          {toast && (
            <span
              className="anim-toast absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-body font-semibold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: COLORS.ink, color: "#F1ECDC" }}
              role="status"
            >
              {toast}
            </span>
          )}
        </div>

        {canDelete && (
          <div className="mt-3">
            <DeleteButton label="Delete loan" onDelete={() => { actions.deleteLoan(loan.id, currentUser.id); onBack(); }} />
          </div>
        )}
        <div className="mt-5">
          <AttachmentsSection kind="loan" ownerId={loan.id} title="Receipts" />
        </div>
        {!canDelete && (
          <p className="font-body text-[12.5px] text-center mt-3" style={{ color: "rgba(18,49,40,0.5)" }}>
            Only {confirmerName} can confirm or cancel this request.
          </p>
        )}
      </div>

      <div className="rounded-t-[28px] p-6 pt-5 flex-1" style={{ backgroundColor: COLORS.ink }}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "rgba(241,236,220,0.25)" }} />
        <h3 className="font-display font-semibold text-[16px] mb-1" style={{ color: "#F1ECDC" }}>
          Repayment History
        </h3>
        <p className="font-body text-[12px] mb-4" style={{ color: "rgba(241,236,220,0.45)" }}>
          {money(repaid)} repaid of {money(loan.amount)}
        </p>
        <div className="flex flex-col gap-4">
          {(loan.repayments || []).map((r, i) => (
            <div key={`${r.date}-${r.amount}-${i}`} className="anim-item flex items-center gap-3" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <Avatar bg={person?.bg} name={person?.name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
                  {loan.direction === "owedToYou" ? person?.name ?? "Roommate" : "You"}
                </div>
                <div className="font-body text-[12px]" style={{ color: "rgba(241,236,220,0.5)" }}>
                  {r.date}
                </div>
              </div>
              <div className="font-display font-bold text-[15px]" style={{ color: COLORS.lime }}>
                +{money(r.amount)}
              </div>
            </div>
          ))}
          {(loan.repayments || []).length === 0 && (
            <p className="font-body text-[13px]" style={{ color: "rgba(241,236,220,0.4)" }}>
              No repayments logged yet.
            </p>
          )}
        </div>
      </div>

      <PayNowModal open={showPay} onClose={() => setShowPay(false)} loan={loan} />
      <AddLoanModal open={showEdit} onClose={() => setShowEdit(false)} loan={loan} />
    </div>
  );
}
