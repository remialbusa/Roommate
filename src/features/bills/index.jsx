import BillsHome from "./BillsHome";
import BillDetail from "./BillDetail";

export default function BillsFeature({ screen, activeBill, onNavigate }) {
  if (screen === "bill") {
    return <BillDetail billId={activeBill} onBack={() => onNavigate("home")} />;
  }
  return <BillsHome onOpenBill={(id) => onNavigate("bill", id)} />;
}
