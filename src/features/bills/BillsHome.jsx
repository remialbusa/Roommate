import { useState } from "react";
import { Plus } from "lucide-react";
import HouseholdButton from "../../components/HouseholdButton";
import ProgressGauge from "../../components/ProgressGauge";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { useMoney, dueSortKey } from "../../utils/format";
import BillRow from "./BillRow";
import AddBillModal from "./AddBillModal";

const FILTERS = ["All", "Rent", "Utilities"];

export default function BillsHome({ onOpenBill }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("All");
  const { state } = useAppState();
  const { money } = useMoney();
  const { bills } = state;

  const totalDue = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
  const paid = bills.reduce((s, b) => {
    const ids = Object.keys(b.splits || {});
    if (ids.length === 0) return s;
    const paidCount = ids.filter((id) => b.splits[id]).length;
    return s + (Number(b.amount || 0) / ids.length) * paidCount;
  }, 0);
  const pct = totalDue > 0 ? Math.round((paid / totalDue) * 100) : 0;
  const pendingCount = bills.filter((b) => Object.values(b.splits || {}).some((v) => !v)).length;
  const visible = bills.filter((b) => filter === "All" || b.category === filter);

  return (
    <div className="rounded-[32px] p-6 pb-8 flex flex-col gap-5" style={{ backgroundColor: COLORS.ink }}>
      <div className="flex items-center justify-between">
        <Logo />
        <HouseholdButton />
      </div>

      <h1 className="font-display font-semibold text-[34px] leading-[1.05]" style={{ color: "#F1ECDC" }}>
        Rent &amp;
        <br />
        Utilities
      </h1>

      {bills.length === 0 ? (
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "rgba(241,236,220,0.06)" }}>
          <p className="font-display font-bold text-[18px] mb-1" style={{ color: "#F1ECDC" }}>
            No bills yet
          </p>
          <p className="font-body text-[13px] mb-4" style={{ color: "rgba(241,236,220,0.55)" }}>
            Add your first bill to start splitting with roommates.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-3 rounded-xl font-body font-semibold text-[14px] transition-transform active:scale-[0.97]"
            style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
          >
            Add your first bill
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-3xl p-6 pb-5" style={{ background: `linear-gradient(180deg, ${COLORS.limeLight} 0%, ${COLORS.limeDark} 100%)` }}>
            <h2 className="font-display font-bold text-[20px] mb-2" style={{ color: COLORS.ink }}>
              Paid This Month
            </h2>
            <ProgressGauge percent={pct} />
            <div className="flex items-end justify-between -mt-2 gap-2">
              <span className="font-display font-bold text-[20px]" style={{ color: COLORS.ink }}>
                {money(paid)}
                <span className="font-body font-medium text-[15px] opacity-70"> / {money(totalDue)}</span>
              </span>
              <span className="font-display font-bold text-[26px]" style={{ color: COLORS.ink }}>
                {pct}%
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-body font-semibold text-[15px] transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FE84F]"
            style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
          >
            <Plus size={19} />
            Add Bill
          </button>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 app-scroll" role="group" aria-label="Filter bills">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={f === filter}
                  className="px-4 py-2 rounded-full font-body font-semibold text-[13px] shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
                  style={{ backgroundColor: f === filter ? COLORS.lime : "rgba(241,236,220,0.08)", color: f === filter ? COLORS.ink : "rgba(241,236,220,0.7)" }}
                >
                  {f}
                </button>
              ))}
            </div>
            {visible
              .map((b, i) => ({ b, i }))
              .sort((x, y) => dueSortKey(x.b, x.i) - dueSortKey(y.b, y.i))
              .map(({ b }, si) => (
                <BillRow key={b.id} bill={b} index={si} onOpen={() => onOpenBill(b.id)} />
              ))}
            {visible.length === 0 && (
              <p className="font-body text-[13px] text-center py-6" style={{ color: "rgba(241,236,220,0.4)" }}>
                No {filter.toLowerCase()} bills yet.
              </p>
            )}
            {visible.length > 0 && (
              <p className="font-body text-[12px] text-center" style={{ color: "rgba(241,236,220,0.35)" }}>
                Tap a row for split details · Pay settles your share instantly
              </p>
            )}
          </div>
        </>
      )}

      <AddBillModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
