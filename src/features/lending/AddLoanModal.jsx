import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { TextField, SelectField, SubmitRow } from "../../components/FormControls";
import { useAppState } from "../../state/AppStateContext";
import { useMoney } from "../../utils/format";

export default function AddLoanModal({ open, onClose, loan }) {
  const { state, actions, currentUser } = useAppState();
  const { symbol } = useMoney();
  const { users } = state;
  const isEdit = Boolean(loan);
  const roommateIds = Object.keys(users).filter((id) => id !== currentUser?.id);
  const [roommate, setRoommate] = useState(roommateIds[0] ?? "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("owedToYou");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setRoommate(loan?.roommate ?? roommateIds[0] ?? "");
      setTitle(loan?.title ?? "");
      setAmount(loan ? String(loan.amount) : "");
      setDirection(loan?.direction ?? "owedToYou");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loan?.id]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!roommate || !users[roommate]) return setError("Select a roommate for this loan.");
    if (!title.trim()) return setError("Please say what the loan is for.");
    if (!(Number(amount) > 0)) return setError(`Amount must be greater than ${symbol}0.`);
    if (isEdit) {
      const repaid = (loan.repayments || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      if (Number(amount) < repaid) return setError(`Amount can't be below what's already repaid (${symbol}${repaid}).`);
      actions.updateLoan({ id: loan.id, roommate, title: title.trim(), amount: Number(amount), direction, actorId: currentUser.id });
    } else {
      actions.addLoan({ roommate, title: title.trim(), amount: Number(amount), direction, actorId: currentUser.id });
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Loan" : "New Loan"}>
      <form onSubmit={handleSubmit}>
        <SelectField label="Roommate" value={roommate} onChange={(e) => setRoommate(e.target.value)} required>
          <option value="" disabled>
            {roommateIds.length === 0 ? "No other members yet" : "Select roommate"}
          </option>
          {roommateIds.map((id) => (
            <option key={id} value={id}>
              {users[id].name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Direction" value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="owedToYou">I'm lending — they owe me</option>
          <option value="youOwe">I'm borrowing — I owe them</option>
        </SelectField>
        <TextField label="What's it for?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Groceries run" required maxLength={60} />
        <TextField label={`Amount (${symbol})`} type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        {error && (
          <p className="font-body text-[13px] mb-3" style={{ color: "#F0492A" }} role="alert">
            {error}
          </p>
        )}
        <SubmitRow onCancel={onClose} submitLabel={isEdit ? "Save Changes" : "Add Loan"} />
      </form>
    </Modal>
  );
}
