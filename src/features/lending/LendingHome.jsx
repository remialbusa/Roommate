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
import LoanRow from "./LoanRow";

function MemberCard({ memberId, person, owed, owe, net, loans, pending, expanded, index, onToggle, onOpenBalances, onOpenLoan }) {
  const { money } = useMoney();
  const sub =
    owed > 0 && owe > 0
      ? `Owes you ${money(owed)} · You owe ${money(owe)}`
      : owed > 0
        ? `Owes you ${money(owed)}`
        : owe > 0
          ? `You owe ${money(owe)}`
          : "Settled up";
  return (
    <div className="anim-item rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(241,236,220,0.06)", animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
      >
        <Avatar bg={person.bg} name={person.name} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
            {person.name}
          </div>
          <div className="font-body text-[12px] truncate" style={{ color: "rgba(241,236,220,0.5)" }}>
            {sub}
          </div>
        </div>
        <div
          className="font-display font-bold text-[16px] shrink-0"
          style={{ color: net > 0 ? COLORS.lime : net < 0 ? COLORS.ember : "rgba(241,236,220,0.4)" }}
        >
          {net === 0 ? "—" : net > 0 ? money(net) : `−${money(Math.abs(net))}`}
        </div>
        <ChevronRight
          size={15}
          color="rgba(241,236,220,0.4)"
          className="shrink-0 transition-transform"
          style={{ transform: expanded ? "rotate(90deg)" : "none" }}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {loans.map((l) => (
            <LoanRow key={l.id} loan={l} person={person} onOpen={() => onOpenLoan(l.id)} />
          ))}
          {pending.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ border: "1.5px solid rgba(240,185,11,0.4)", backgroundColor: "rgba(240,185,11,0.06)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-[13.5px] truncate" style={{ color: "#F1ECDC" }}>
                  {l.title}
                </div>
                <div className="font-body text-[11.5px]" style={{ color: COLORS.gold }}>
                  {(l.status || "pending") === "pending" ? "Awaiting confirmation" : "Declined"}
                </div>
              </div>
              <span className="font-display font-bold text-[14px] shrink-0" style={{ color: "#F1ECDC" }}>
                {money(l.amount)}
              </span>
            </div>
          ))}
          {loans.length === 0 && pending.length === 0 && (
            <p className="font-body text-[12.5px] px-1 pb-1" style={{ color: "rgba(241,236,220,0.4)" }}>
              Nothing between you two yet.
            </p>
          )}
          <button
            onClick={() => onOpenBalances(memberId)}
            className="font-body font-bold text-[13px] underline underline-offset-4 decoration-2 self-start ml-1 mb-1 rounded focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
            style={{ color: COLORS.lime }}
          >
            Open in Balances →
          </button>
        </div>
      )}
    </div>
  );
}

export default function LendingHome({ onOpenBalances, onOpenLoan }) {
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
  // Per-member books from YOUR perspective (viewer-mapped loans make
  // roommate always the other party): separate owed/owe totals plus
  // that member's own loans, so nothing is over-consolidated.
  const memberIds = Object.keys(users).filter((id) => id !== currentUser?.id);
  const memberBooks = memberIds
    .map((id) => {
      const mine = confirmed.filter((l) => l.roommate === id);
      const owed = mine.filter((l) => l.direction === "owedToYou").reduce((s, l) => s + loanRemaining(l), 0);
      const owe = mine.filter((l) => l.direction === "youOwe").reduce((s, l) => s + loanRemaining(l), 0);
      return {
        id,
        owed,
        owe,
        net: owed - owe,
        loans: mine.slice().sort((a, b) => loanRemaining(b) - loanRemaining(a)),
        pending: loans.filter((l) => l.roommate === id && loanStatus(l) !== "confirmed"),
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || (b.owed + b.owe) - (a.owed + a.owe));
  const [expandedId, setExpandedId] = useState(null);
  const [touched, setTouched] = useState(false);
  // Auto-expand the first unsettled member until the user takes over.
  const autoId = (() => {
    const firstActive = memberBooks.find((m) => m.net !== 0 || m.pending.length > 0);
    return firstActive ? firstActive.id : null;
  })();
  const shownId = touched ? expandedId : (expandedId ?? autoId);

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
                {pending.length > 0 ? `${pending.length} awaiting confirmation` : "Tap a person to expand"}
              </span>
            </div>
            {memberBooks.map(({ id, owed, owe, net, loans: mine, pending: pend }, i) => {
              const person = users[id];
              if (!person) return null;
              return (
                <MemberCard
                  key={id}
                  memberId={id}
                  person={person}
                  owed={owed}
                  owe={owe}
                  net={net}
                  loans={mine}
                  pending={pend}
                  expanded={shownId === id}
                  index={i}
                  onToggle={() => {
                    setTouched(true);
                    setExpandedId((cur) => (cur === id ? null : id));
                  }}
                  onOpenBalances={onOpenBalances}
                  onOpenLoan={onOpenLoan}
                />
              );
            })}
          </div>
        </>
      )}

      <AddLoanModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
