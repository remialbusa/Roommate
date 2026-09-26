import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { TextField, SubmitRow } from "../../components/FormControls";
import { useAppState } from "../../state/AppStateContext";
import { useMoney, loanRemaining } from "../../utils/format";

export default function PayNowModal({ open, onClose, loan }) {
  const { actions, currentUser } = useAppState();
  const { money, symbol } = useMoney();
  const remaining = loan ? loanRemaining(loan) : 0;
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loan && open) {
      setAmount(remaining > 0 ? String(remaining) : "");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan?.id, open]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const n = Number(amount);
    if (!loan || !(n > 0)) return setError("Enter an amount greater than $0.");
    if (n > remaining) return setError(`That exceeds the ${money(remaining)} remaining.`);
    actions.addRepayment(loan.id, n, currentUser.id);
    onClose();
  }

  if (!loan) return null;

  return (
    <Modal open={open} onClose={onClose} title={loan.direction === "owedToYou" ? "Log a Repayment" : "Log a Payment"}>
      <form onSubmit={handleSubmit}>
        <p className="font-body text-[13px] mb-3" style={{ color: "rgba(18,49,40,0.6)" }}>
          {money(remaining)} remaining on "{loan.title}".
        </p>
        <TextField label={`Amount (${symbol})`} type="number" min="0.01" step="0.01" max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required error={error} />
        <SubmitRow onCancel={onClose} submitLabel="Log Payment" />
      </form>
    </Modal>
  );
}
