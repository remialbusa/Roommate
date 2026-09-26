import { useState } from "react";
import LendingHome from "./LendingHome";
import Balances from "./Balances";
import LoanDetail from "./LoanDetail";

export default function LendingFeature() {
  const [screen, setScreen] = useState("home");
  const [activeLoan, setActiveLoan] = useState(null);

  if (screen === "balances") {
    return (
      <div key="balances" className="anim-screen">
        <Balances
          onBack={() => setScreen("home")}
          onOpenLoan={(id) => {
            setActiveLoan(id);
            setScreen("loan");
          }}
        />
      </div>
    );
  }
  if (screen === "loan") {
    return (
      <div key="loan" className="anim-screen">
        <LoanDetail loanId={activeLoan} onBack={() => setScreen("balances")} />
      </div>
    );
  }
  return (
    <div key="home" className="anim-screen">
      <LendingHome onOpenBalances={() => setScreen("balances")} />
    </div>
  );
}
