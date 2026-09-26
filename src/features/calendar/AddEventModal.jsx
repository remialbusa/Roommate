import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { TextField, SelectField, CheckboxRow, SubmitRow } from "../../components/FormControls";
import { useAppState } from "../../state/AppStateContext";

const COLOR_OPTIONS = [
  { value: "lime", label: "Green" },
  { value: "gold", label: "Gold" },
  { value: "ember", label: "Ember" },
];

export default function AddEventModal({ open, onClose, event, daysInMonth = 31, prefillDay }) {
  const { state, actions, currentUser } = useAppState();
  const { users } = state;
  const roommateIds = Object.keys(users);
  const isEdit = Boolean(event);

  const [title, setTitle] = useState("");
  const [day, setDay] = useState(1);
  const [time, setTime] = useState("");
  const [color, setColor] = useState("lime");
  const [people, setPeople] = useState(roommateIds);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(event?.title ?? "");
      setDay(event?.day ?? prefillDay ?? 1);
      setTime(event?.time ?? "");
      setColor(event?.color ?? "lime");
      setPeople(event?.people ?? Object.keys(users));
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id, prefillDay]);

  function togglePerson(id) {
    setPeople((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const dayNum = Number(day);
    if (!title.trim()) return setError("Please give the event a title.");
    if (!(dayNum >= 1 && dayNum <= daysInMonth)) return setError(`Day must be between 1 and ${daysInMonth}.`);
    if (!time.trim()) return setError("Please add a time (or “All day”).");
    if (people.length === 0) return setError("Select at least one attendee.");
    const payload = { title: title.trim(), day: dayNum, time: time.trim(), color, people, actorId: currentUser.id };
    if (isEdit) {
      actions.updateEvent({ id: event.id, ...payload });
    } else {
      actions.addEvent(payload);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Event" : "Add an Event"}>
      <form onSubmit={handleSubmit}>
        <TextField label="Event title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Movie Night" required maxLength={80} />
        <TextField label={`Day of month (1–${daysInMonth})`} type="number" min="1" max={daysInMonth} value={day} onChange={(e) => setDay(e.target.value)} required />
        <TextField label="Time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 7:00 PM or All day" required maxLength={40} />
        <SelectField label="Color tag" value={color} onChange={(e) => setColor(e.target.value)}>
          {COLOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <div className="mb-2">
          <span className="font-body font-semibold text-[12.5px]" style={{ color: "rgba(18,49,40,0.6)" }}>
            Attending
          </span>
          <div className="mt-1 max-h-40 overflow-y-auto app-scroll">
            {roommateIds.map((id) => (
              <CheckboxRow key={id} label={users[id].name} checked={people.includes(id)} onChange={() => togglePerson(id)} />
            ))}
          </div>
        </div>
        {error && (
          <p className="font-body text-[13px] mb-3" style={{ color: "#F0492A" }} role="alert">
            {error}
          </p>
        )}
        <SubmitRow onCancel={onClose} submitLabel={isEdit ? "Save Changes" : "Add Event"} />
      </form>
    </Modal>
  );
}
