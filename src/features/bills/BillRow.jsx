import { Check, ChevronRight } from "lucide-react";
import { COLORS } from "../../theme";
import { billShare, useMoney, formatBillDue } from "../../utils/format";
import { useAppState } from "../../state/AppStateContext";

export default function BillRow({ bill, onOpen, index = 0 }) {
  const { actions, currentUser } = useAppState();
  const { money } = useMoney();
  const ids = Object.keys(bill.splits || {});
  const paidCount = ids.filter((id) => bill.splits[id]).length;
  const done = ids.length > 0 && paidCount === ids.length;
  const share = billShare(bill);
  const iAmIn = Boolean(currentUser && bill.splits && currentUser.id in bill.splits);
  const myPaid = Boolean(iAmIn && bill.splits[currentUser.id]);

  function payMine(e) {
    e.stopPropagation();
    actions.toggleBillPaid(bill.id, currentUser.id);
  }

  return (
    <div
      className="anim-item rounded-2xl flex items-center gap-2 pl-4 pr-2 py-2"
      style={{ backgroundColor: "rgba(241,236,220,0.06)", animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <button
        onClick={onOpen}
        aria-label={`Open ${bill.name}`}
        className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
      >
        <div className="flex-1 min-w-0">
          <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
            {bill.name}
          </div>
          <div className="font-body text-[12px]" style={{ color: "rgba(241,236,220,0.5)" }}>
            Due {formatBillDue(bill)}
            {bill.recurrence && bill.recurrence !== "None" ? ` · Repeats ${bill.recurrence.toLowerCase()}` : ""} · {paidCount}/{ids.length} paid
          </div>
        </div>
        <div className="font-display font-bold text-[16px] shrink-0" style={{ color: done ? COLORS.lime : "#F1ECDC" }}>
          {money(bill.amount)}
        </div>
        <ChevronRight size={15} color="rgba(241,236,220,0.4)" className="shrink-0" />
      </button>
      {iAmIn && !myPaid && (
        <button
          onClick={payMine}
          aria-label={`Pay your ${money(share)} share of ${bill.name}`}
          className="shrink-0 px-3.5 py-2.5 rounded-xl font-body font-bold text-[13px] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
          style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
        >
          Pay {money(share)}
        </button>
      )}
      {iAmIn && myPaid && (
        <span
          className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full font-body font-semibold text-[12px]"
          style={{ backgroundColor: "rgba(143,232,79,0.18)", color: COLORS.lime }}
        >
          <Check size={13} />
          Paid
        </span>
      )}
    </div>
  );
}
