import { useState } from "react";
import { Coins, Wallet } from "lucide-react";
import HouseholdButton from "../../components/HouseholdButton";
import Avatar from "../../components/Avatar";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { loanRemaining, useMoney } from "../../utils/format";
import { ActionTile, SummaryCard } from "../../components/actions";
import AddLoanModal from "./AddLoanModal";

export default function LendingHome({ onOpenBalances }) {
  const [showAdd, setShowAdd] = useState(false);
  const { state } = useAppState();
  const { money } = useMoney();
  const { loans, users } = state;

  const openLoans = loans.filter((l) => loanRemaining(l) > 0);
  const netOwedToYou = loans.reduce((sum, l) => {
    const remaining = loanRemaining(l);
    return sum + (l.direction === "owedToYou" ? remaining : -remaining);
  }, 0);
  const involved = [...new Set(loans.map((l) => l.roommate))].filter((id) => users[id]).slice(0, 4);

  return (
    <div className="rounded-[32px] p-6 pb-8 flex flex-col gap-6" style={{ backgroundColor: COLORS.ink }}>
      <div className="flex items-center justify-between">
        <Logo />
        <HouseholdButton />
      </div>

      <h1 className="font-display font-semibold text-[34px] leading-[1.05]" style={{ color: "#F1ECDC" }}>
        Money
        <br />
        Lending
      </h1>

      {loans.length === 0 ? (
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "rgba(241,236,220,0.06)" }}>
          <p className="font-display font-bold text-[18px] mb-1" style={{ color: "#F1ECDC" }}>
            No loans yet
          </p>
          <p className="font-body text-[13px] mb-4" style={{ color: "rgba(241,236,220,0.55)" }}>
            Lend to a roommate or log money you borrowed.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-3 rounded-xl font-body font-semibold text-[14px] transition-transform active:scale-[0.97]"
            style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
          >
            Log your first loan
          </button>
        </div>
      ) : (
        <>
          <div>
            <div className="font-display font-bold text-[36px]" style={{ color: netOwedToYou >= 0 ? COLORS.lime : COLORS.ember }}>
              {money(Math.abs(netOwedToYou))}
            </div>
            <div className="text-[13px] mt-1" style={{ color: "rgba(241,236,220,0.65)" }}>
              {netOwedToYou >= 0 ? "You're owed overall" : "You owe overall"} · {openLoans.length} open
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionTile
              icon={<Coins size={20} color={COLORS.ink} />}
              label="Log Loan"
              hint="Lend or borrow"
              variant="primary"
              onClick={() => setShowAdd(true)}
            />
            <ActionTile
              icon={<Wallet size={20} color={COLORS.ink} />}
              label="Balances"
              hint="Owed vs owing"
              variant="secondary"
              onClick={onOpenBalances}
            />
          </div>

          <SummaryCard
            title="Active Loans"
            status={`${openLoans.length} open`}
            amount={String(openLoans.length)}
            caption="Between you and your roommates"
            extra={
              <div className="flex -space-x-2">
                {involved.map((id) => (
                  <Avatar key={id} bg={users[id]?.bg} name={users[id]?.name} size={34} ring={COLORS.gold} />
                ))}
              </div>
            }
          />
        </>
      )}

      <AddLoanModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
