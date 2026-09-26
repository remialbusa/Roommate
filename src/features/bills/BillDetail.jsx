import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Bell, CheckCircle2, Clock3 } from "lucide-react";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { useMoney } from "../../utils/format";
import { ActionTile, DeleteButton } from "../../components/actions";
import SplitBillModal from "./SplitBillModal";

function useToast() {
  const [toast, setToast] = useState("");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function show(msg) {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 1800);
  }
  return [toast, show];
}

export default function BillDetail({ billId, onBack }) {
  const { state, actions, currentUser } = useAppState();
  const { money } = useMoney();
  const { users } = state;
  const bill = state.bills.find((b) => b.id === billId);
  const [toast, showToast] = useToast();
  const [showSplit, setShowSplit] = useState(false);

  if (!bill) {
    return (
      <div className="rounded-[32px] p-6" style={{ backgroundColor: COLORS.ink }}>
        <ScreenHeader title="Bill" onBack={onBack} dark />
        <p className="font-body text-[14px]" style={{ color: "#F1ECDC" }}>
          This bill no longer exists.
        </p>
      </div>
    );
  }

  const participantIds = Object.keys(bill.splits || {}).filter((id) => users[id]);
  const share = participantIds.length > 0 ? Number(bill.amount || 0) / participantIds.length : 0;
  const paidCount = participantIds.filter((id) => bill.splits[id]).length;

  function sendReminder() {
    const pending = participantIds.length - paidCount;
    if (pending === 0) return showToast("Everyone has paid 🎉");
    if (state.settings?.logReminders !== false) actions.logActivity({ roommate: currentUser.id, category: "bills", action: `sent a reminder about “${bill.name}” to ${pending} ${pending === 1 ? "roommate" : "roommates"}` });
    showToast("Reminder sent — logged in Activity");
  }

  return (
    <div className="rounded-[32px] overflow-hidden flex flex-col" style={{ backgroundColor: COLORS.creamCard }}>
      <div className="p-6 pb-7">
        <ScreenHeader title={bill.name} onBack={onBack} />

        <div className="flex flex-col items-center text-center">
          <div className="min-h-[76px] px-6 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: COLORS.gold }}>
            <span className="font-display font-bold text-[26px]" style={{ color: COLORS.ink }}>
              {money(bill.amount)}
            </span>
          </div>
          <h2 className="font-display font-bold text-[18px] truncate max-w-full" style={{ color: COLORS.ink }}>
            {bill.name}
          </h2>
          <p className="font-body text-[13px] mt-0.5" style={{ color: "rgba(18,49,40,0.6)" }}>
            Due {bill.due} · {money(share)} per person · {paidCount}/{participantIds.length} paid
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 relative">
          <ActionTile
            icon={<SlidersHorizontal size={20} color={COLORS.ink} />}
            label="Split Bill"
            hint="Choose who's in"
            variant="gold"
            onClick={() => setShowSplit(true)}
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
              aria-live="polite"
            >
              {toast}
            </span>
          )}
        </div>

        <div className="mt-3">
          <DeleteButton label="Delete bill" onDelete={() => { actions.deleteBill(bill.id, currentUser.id); onBack(); }} />
        </div>
      </div>

      <div className="rounded-t-[28px] p-6 pt-5 flex-1" style={{ backgroundColor: COLORS.ink }}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "rgba(241,236,220,0.25)" }} />
        <h3 className="font-display font-semibold text-[16px] mb-1" style={{ color: "#F1ECDC" }}>
          Split Between Roommates
        </h3>
        <p className="font-body text-[12px] mb-4" style={{ color: "rgba(241,236,220,0.45)" }}>
          Tap a roommate to toggle their paid status.
        </p>
        <div className="flex flex-col gap-4">
          {participantIds.map((id, i) => {
            const paid = bill.splits[id];
            const r = users[id];
            if (!r) return null;
            return (
              <button
                key={id}
                onClick={() => actions.toggleBillPaid(bill.id, id)}
                className="anim-item flex items-center gap-3 text-left transition-transform active:scale-[0.98] rounded-xl focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                aria-pressed={Boolean(paid)}
              >
                <div className="relative">
                  <Avatar bg={r.bg} name={r.name} size={40} />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: paid ? COLORS.lime : COLORS.gold, boxShadow: `0 0 0 2px ${COLORS.ink}` }}
                  >
                    {paid ? <CheckCircle2 size={10} color={COLORS.ink} /> : <Clock3 size={10} color={COLORS.ink} />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
                    {r.name}
                  </div>
                  <div className="font-body text-[12px]" style={{ color: "rgba(241,236,220,0.5)" }}>
                    {paid ? "Paid" : "Pending"}
                  </div>
                </div>
                <div className="font-display font-bold text-[15px]" style={{ color: paid ? COLORS.lime : COLORS.ember }}>
                  {money(share)}
                </div>
              </button>
            );
          })}
          {participantIds.length === 0 && (
            <p className="font-body text-[13px] text-center py-4" style={{ color: "rgba(241,236,220,0.4)" }}>
              No participants left on this bill.
            </p>
          )}
        </div>
      </div>

      <SplitBillModal open={showSplit} onClose={() => setShowSplit(false)} bill={bill} />
    </div>
  );
}
