import { useState } from "react";
import BillsHome from "./BillsHome";
import BillDetail from "./BillDetail";

export default function BillsFeature() {
  const [screen, setScreen] = useState("home");
  const [activeBill, setActiveBill] = useState(null);

  if (screen === "bill") {
    return (
      <div key="bill" className="anim-screen">
        <BillDetail billId={activeBill} onBack={() => setScreen("home")} />
      </div>
    );
  }
  return (
    <div key="home" className="anim-screen">
      <BillsHome
        onOpenBill={(id) => {
          setActiveBill(id);
          setScreen("bill");
        }}
      />
    </div>
  );
}
