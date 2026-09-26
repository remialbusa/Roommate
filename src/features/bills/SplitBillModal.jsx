import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { CheckboxRow, SubmitRow } from "../../components/FormControls";
import { useAppState } from "../../state/AppStateContext";
import { useMoney } from "../../utils/format";

export default function SplitBillModal({ open, onClose, bill }) {
  const { state, actions, currentUser } = useAppState();
  const { money } = useMoney();
  const { users } = state;
  const roommateIds = Object.keys(users);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (bill && open) {
      setParticipants(Object.keys(bill.splits || {}));
      setError("");
    }
  }, [bill, open]);

  function toggleParticipant(id) {
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!bill) return;
    if (participants.length === 0) return setError("Keep at least one person on the split.");
    actions.updateBillSplit(bill.id, participants, currentUser.id);
    onClose();
  }

  if (!bill) return null;
  const perPerson = participants.length > 0 ? Number(bill.amount || 0) / participants.length : 0;

  return (
    <Modal open={open} onClose={onClose} title={`Split "${bill.name}"`}>
      <form onSubmit={handleSubmit}>
        <p className="font-body text-[13px] mb-3" style={{ color: "rgba(18,49,40,0.6)" }}>
          {money(perPerson)} per person across {participants.length} {participants.length === 1 ? "person" : "people"}.
        </p>
        {roommateIds.map((id) => (
          <CheckboxRow key={id} label={`${users[id].name}${bill.splits?.[id] ? " · paid" : ""}`} checked={participants.includes(id)} onChange={() => toggleParticipant(id)} />
        ))}
        {error && (
          <p className="font-body text-[13px] mt-2" style={{ color: "#F0492A" }} role="alert">
            {error}
          </p>
        )}
        <SubmitRow onCancel={onClose} submitLabel="Save Split" />
      </form>
    </Modal>
  );
}
