import { useState, useRef, useEffect } from "react";
import { Edit3, Pin, PinOff } from "lucide-react";
import ScreenHeader from "../../components/ScreenHeader";
import IconButton from "../../components/IconButton";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { DeleteButton } from "../../components/actions";
import AddNoteModal from "./AddNoteModal";
import AttachmentsSection from "../../components/Attachments";

const COLOR_MAP = { gold: COLORS.gold, lime: COLORS.lime, ember: COLORS.ember };

export default function NoteDetail({ noteId, onBack }) {
  const { state, actions, currentUser } = useAppState();
  const note = state.notes.find((n) => n.id === noteId);
  const [toast, setToast] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!note) {
    return (
      <div className="rounded-[32px] p-6" style={{ backgroundColor: COLORS.ink }}>
        <ScreenHeader title="Note" onBack={onBack} dark />
        <p className="font-body text-[14px]" style={{ color: "#F1ECDC" }}>
          This note no longer exists.
        </p>
      </div>
    );
  }

  const author = state.users[note.author];

  function flash(msg) {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 1500);
  }

  function handleDelete() {
    actions.deleteNote(note.id, currentUser.id);
    onBack();
  }

  function handlePin() {
    actions.toggleNotePin(note.id, currentUser.id);
    flash(note.pinned ? "Unpinned" : "Pinned to top");
  }

  return (
    <div className="rounded-[32px] p-6 pb-8 flex flex-col gap-5" style={{ backgroundColor: COLORS.ink }}>
      <ScreenHeader
        title={note.title}
        onBack={onBack}
        dark
        right={<IconButton icon={<Edit3 size={16} />} tone="cream" ariaLabel="Edit note" onClick={() => setShowEdit(true)} />}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[note.color] || COLORS.gold }} />
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar bg={author?.bg} name={author?.name} size={22} />
          <span className="font-body text-[13px] truncate" style={{ color: "rgba(241,236,220,0.6)" }}>
            {author?.name ?? "Unknown"} · {note.time}
          </span>
        </div>
        <button
          onClick={handlePin}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body font-semibold text-[12px] shrink-0"
          style={{ backgroundColor: note.pinned ? COLORS.gold : "rgba(241,236,220,0.08)", color: note.pinned ? COLORS.ink : "#F1ECDC" }}
        >
          {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          {note.pinned ? "Unpin" : "Pin"}
        </button>
      </div>

      <div className="rounded-2xl p-5 flex-1" style={{ backgroundColor: "rgba(241,236,220,0.06)" }}>
        <p className="font-body text-[14.5px] leading-relaxed whitespace-pre-line break-words" style={{ color: "#F1ECDC" }}>
          {note.body}
        </p>
      </div>

      <AttachmentsSection kind="note" ownerId={note.id} title="Attachments" dark />

      <div className="grid grid-cols-2 gap-3 relative">
        <button
          onClick={() => setShowEdit(true)}
          className="rounded-2xl py-4 flex items-center justify-center gap-2 transition-transform active:scale-[0.97]"
          style={{ backgroundColor: COLORS.gold }}
        >
          <Edit3 size={16} color={COLORS.ink} />
          <span className="font-body font-semibold text-[14px]" style={{ color: COLORS.ink }}>
            Edit Note
          </span>
        </button>
        <div>
          <DeleteButton
            label="Delete"
            onDelete={handleDelete}
            dark
          />
        </div>
        {toast && (
          <span className="anim-toast absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-body font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS.creamCard, color: COLORS.ink }} role="status">
            {toast}
          </span>
        )}
      </div>

      <AddNoteModal open={showEdit} onClose={() => setShowEdit(false)} note={note} />
    </div>
  );
}
