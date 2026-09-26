import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { TextField, TextAreaField, SelectField, SubmitRow } from "../../components/FormControls";
import { useAppState } from "../../state/AppStateContext";

const COLOR_OPTIONS = [
  { value: "gold", label: "Gold" },
  { value: "lime", label: "Green" },
  { value: "ember", label: "Ember" },
];

export default function AddNoteModal({ open, onClose, note }) {
  const { actions, currentUser } = useAppState();
  const isEdit = Boolean(note);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState("gold");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setBody(note?.body ?? "");
      setColor(note?.color ?? "gold");
      setError("");
    }
  }, [open, note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Please give the note a title.");
    if (!body.trim()) return setError("Please write something in the note.");
    if (isEdit) {
      actions.updateNote({ id: note.id, title: title.trim(), body: body.trim(), color, actorId: currentUser.id });
    } else {
      actions.addNote({ title: title.trim(), body: body.trim(), color, actorId: currentUser.id });
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Note" : "Add a Note"}>
      <form onSubmit={handleSubmit}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Parking Info" required maxLength={80} />
        <TextAreaField label="Note" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the details here..." required maxLength={2000} />
        <SelectField label="Color tag" value={color} onChange={(e) => setColor(e.target.value)}>
          {COLOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        {error && (
          <p className="font-body text-[13px] mb-3" style={{ color: "#F0492A" }} role="alert">
            {error}
          </p>
        )}
        <SubmitRow onCancel={onClose} submitLabel={isEdit ? "Save Changes" : "Add Note"} />
      </form>
    </Modal>
  );
}
