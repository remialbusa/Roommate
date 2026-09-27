import { useState } from "react";
import { Coins, Wallet, ChevronRight } from "lucide-react";
import HouseholdButton from "../../components/HouseholdButton";
import Avatar from "../../components/Avatar";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { loanRemaining, useMoney, loanStatus } from "../../utils/format";
import { ActionTile } from "../../components/actions";
import AddLoanModal from "./AddLoanModal";

export default function LendingHome({ onOpenBalances }) {
  const [showAdd, setShowAdd] = useState(false);
  const { state, currentUser } = useAppState();
  const { money } = useMoney();
  const { loans, users } = state;

  const confirmed = loans.filter((l) => loanStatus(l) === "confirmed");
  const pending = loans.filter((l) => loanStatus(l) === "pending");
  const openLoans = confirmed.filter((l) => loanRemaining(l) > 0);
  const netOwedToYou = confirmed.reduce((sum, l) => {
    const remaining = loanRemaining(l);
    return sum + (l.direction === "owedToYou" ? remaining : -remaining);
  }, 0);
  // Per-member net from YOUR perspective (viewer-mapped loans make
  // roommate always the other party).
  const memberIds = Object.keys(users).filter((id) => id !== currentUser?.id);
  const memberNets = memberIds
    .map((id) => {
      const net = confirmed.reduce((sum, l) => {
        if (l.roommate !== id) return sum;
        const remaining = loanRemaining(l);
        return sum + (l.direction === "owedToYou" ? remaining : -remaining);
      }, 0);
      return { id, net };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

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
              onClick={() => onOpenBalances()}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display font-semibold text-[15px]" style={{ color: "#F1ECDC" }}>
                With roommates
              </h3>
              <span className="font-body text-[12px]" style={{ color: "rgba(241,236,220,0.45)" }}>
                {pending.length > 0 ? `${pending.length} awaiting confirmation` : "Tap a person for details"}
              </span>
            </div>
            {memberNets.map(({ id, net }, i) => {
              const person = users[id];
              if (!person) return null;
              return (
                <button
                  key={id}
                  onClick={() => onOpenBalances(id)}
                  className="anim-item rounded-2xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
                  style={{ backgroundColor: "rgba(241,236,220,0.06)", animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  <Avatar bg={person.bg} name={person.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
                      {person.name}
                    </div>
                    <div className="font-body text-[12px]" style={{ color: "rgba(241,236,220,0.5)" }}>
                      {net > 0 ? "Owes you" : net < 0 ? "You owe" : "Settled up"}
                    </div>
                  </div>
                  <div
                    className="font-display font-bold text-[16px] shrink-0"
                    style={{ color: net > 0 ? COLORS.lime : net < 0 ? COLORS.ember : "rgba(241,236,220,0.4)" }}
                  >
                    {net === 0 ? "—" : net > 0 ? money(net) : `−${money(Math.abs(net))}`}
                  </div>
                  <ChevronRight size={15} color="rgba(241,236,220,0.4)" className="shrink-0" />
                </button>
              );
            })}
          </div>
        </>
      )}

      <AddLoanModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
