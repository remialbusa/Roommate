import { ChevronRight } from "lucide-react";
import { COLORS } from "../../theme";
import { useMoney, loanRemaining } from "../../utils/format";
import Avatar from "../../components/Avatar";

export default function LoanRow({ loan, person, onOpen, index = 0 }) {
  const { money } = useMoney();
  const remaining = loanRemaining(loan);
  const settled = remaining <= 0;
  return (
    <button
      onClick={onOpen}
      className="anim-item rounded-2xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
      style={{ backgroundColor: "rgba(241,236,220,0.06)", animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <Avatar bg={person?.bg} name={person?.name} size={40} />
      <div className="flex-1 min-w-0">
        <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
          {loan.title}
        </div>
        <div className="font-body text-[12px] truncate" style={{ color: "rgba(241,236,220,0.5)" }}>
          {person?.name ?? "Unknown"} · {loan.date}
        </div>
      </div>
      <div
        className="font-display font-bold text-[16px] shrink-0"
        style={{ color: settled ? "rgba(241,236,220,0.4)" : loan.direction === "owedToYou" ? COLORS.lime : COLORS.ember }}
      >
        {settled ? "Settled" : money(remaining)}
      </div>
      <ChevronRight size={15} color="rgba(241,236,220,0.4)" className="shrink-0" />
    </button>
  );
}
