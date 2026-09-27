import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { TextField, SelectField, CheckboxRow, SubmitRow } from "../../components/FormControls";
import { useAppState } from "../../state/AppStateContext";
import { useMoney, todayYMD, RECURRENCES } from "../../utils/format";

export default function AddBillModal({ open, onClose }) {
  const { state, actions, currentUser } = useAppState();
  const { symbol } = useMoney();
  const { users } = state;
  const roommateIds = Object.keys(users);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Utilities");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayYMD());
  const [recurrence, setRecurrence] = useState("None");
  const [participants, setParticipants] = useState(roommateIds);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setParticipants(Object.keys(users));
      setDueDate(todayYMD());
      setRecurrence("None");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleParticipant(id) {
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function reset() {
    setName("");
    setCategory("Utilities");
    setAmount("");
    setDueDate(todayYMD());
    setRecurrence("None");
    setParticipants(Object.keys(users));
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please give the bill a name.");
    if (!(Number(amount) > 0)) return setError(`Amount must be greater than ${symbol}0.`);
    if (!dueDate) return setError("Please pick a due date.");
    if (participants.length === 0) return setError("Select at least one roommate to split with.");
    actions.addBill({ name: name.trim(), category, amount: Number(amount), dueDate, recurrence, participants, actorId: currentUser.id });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a Bill">
      <form onSubmit={handleSubmit}>
        <TextField label="Bill name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gas Bill" required maxLength={60} />
        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Rent">Rent</option>
          <option value="Utilities">Utilities</option>
        </SelectField>
        <TextField label={`Amount (${symbol})`} type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          <SelectField label="Repeats" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {r === "None" ? "Never" : r}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mb-2">
          <span className="font-body font-semibold text-[12.5px]" style={{ color: "rgba(18,49,40,0.6)" }}>
            Split between
          </span>
          <div className="mt-1 max-h-40 overflow-y-auto app-scroll">
            {roommateIds.map((id) => (
              <CheckboxRow key={id} label={users[id].name} checked={participants.includes(id)} onChange={() => toggleParticipant(id)} />
            ))}
            {roommateIds.length === 0 && (
              <p className="font-body text-[13px] py-2" style={{ color: "rgba(18,49,40,0.55)" }}>
                No roommates yet — sign up more members to split bills.
              </p>
            )}
          </div>
        </div>
        {error && (
          <p className="font-body text-[13px] mb-3" style={{ color: "#F0492A" }} role="alert">
            {error}
          </p>
        )}
        <SubmitRow onCancel={onClose} submitLabel="Add Bill" />
      </form>
    </Modal>
  );
}
