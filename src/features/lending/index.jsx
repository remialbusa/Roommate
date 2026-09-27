import { useState } from "react";
import LendingHome from "./LendingHome";
import Balances from "./Balances";
import LoanDetail from "./LoanDetail";

export default function LendingFeature({ screen, activeLoan, onNavigate }) {
  const [balanceFilter, setBalanceFilter] = useState("All");

  if (screen === "balances") {
    return (
      <Balances
        onBack={() => onNavigate("home")}
        initialMember={balanceFilter}
        onOpenLoan={(id) => onNavigate("loan", id)}
      />
    );
  }
  if (screen === "loan") {
    return <LoanDetail loanId={activeLoan} onBack={() => onNavigate("balances")} />;
  }
  return (
    <LendingHome
      onOpenBalances={(memberId) => {
        setBalanceFilter(memberId || "All");
        onNavigate("balances");
      }}
      onOpenLoan={(id) => onNavigate("loan", id)}
    />
  );
}
