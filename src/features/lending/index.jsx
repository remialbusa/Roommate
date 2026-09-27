import { useState } from "react";
import LendingHome from "./LendingHome";
import Balances from "./Balances";
import LoanDetail from "./LoanDetail";

export default function LendingFeature() {
  const [screen, setScreen] = useState("home");
  const [activeLoan, setActiveLoan] = useState(null);
  const [balanceFilter, setBalanceFilter] = useState("All");

  if (screen === "balances") {
    return (
      <Balances
        onBack={() => setScreen("home")}
        initialMember={balanceFilter}
        onOpenLoan={(id) => {
          setActiveLoan(id);
          setScreen("loan");
        }}
      />
    );
  }
  if (screen === "loan") {
    return <LoanDetail loanId={activeLoan} onBack={() => setScreen("balances")} />;
  }
  return (
    <LendingHome
      onOpenBalances={(memberId) => {
        setBalanceFilter(memberId || "All");
        setScreen("balances");
      }}
    />
  );
}
