import { useState, useRef, useEffect } from "react";
import { Clock3, Edit3 } from "lucide-react";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { DeleteButton } from "../../components/actions";
import AddEventModal from "./AddEventModal";
import AttachmentsSection from "../../components/Attachments";

const COLOR_MAP = { gold: COLORS.gold, lime: COLORS.lime, ember: COLORS.ember };

export default function EventDetail({ eventId, onBack }) {
  const { state, actions, currentUser } = useAppState();
  const { users } = state;
  const event = state.events.find((e) => e.id === eventId);
  const [toast, setToast] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!event) {
    return (
      <div className="rounded-[32px] p-6" style={{ backgroundColor: COLORS.ink }}>
        <ScreenHeader title="Event" onBack={onBack} dark />
        <p className="font-body text-[14px]" style={{ color: "#F1ECDC" }}>
          This event no longer exists.
        </p>
      </div>
    );
  }

  function flash(msg) {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 1500);
  }

  function handleRemove() {
    actions.deleteEvent(event.id, currentUser.id);
    onBack();
  }

  return (
    <div className="rounded-[32px] p-6 pb-8 flex flex-col gap-5" style={{ backgroundColor: COLORS.ink }}>
      <ScreenHeader title="Event Details" onBack={onBack} dark />

      <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ backgroundColor: COLOR_MAP[event.color] || COLORS.gold }}>
        <span className="font-display font-bold text-[46px] leading-none" style={{ color: COLORS.ink }}>
          {event.day}
        </span>
        <h2 className="font-display font-bold text-[19px] mt-2 break-words max-w-full" style={{ color: COLORS.ink }}>
          {event.title}
        </h2>
        <div className="flex items-center gap-1.5 mt-2">
          <Clock3 size={13} color={COLORS.ink} />
          <span className="font-body font-semibold text-[13px]" style={{ color: COLORS.ink, opacity: 0.75 }}>
            {event.time}
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(241,236,220,0.06)" }}>
        <h3 className="font-body font-semibold text-[13px] mb-3" style={{ color: "rgba(241,236,220,0.6)" }}>
          Attending · {(event.people || []).length}
        </h3>
        <div className="flex flex-col gap-3">
          {(event.people || []).map((id, i) => (
            <div key={id} className="anim-item flex items-center gap-3" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <Avatar bg={users[id]?.bg} name={users[id]?.name} size={34} />
              <span className="font-body font-semibold text-[14px] truncate" style={{ color: "#F1ECDC" }}>
                {users[id]?.name ?? "Unknown"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AttachmentsSection kind="event" ownerId={event.id} title="Attachments" dark />

      <div className="grid grid-cols-2 gap-3 relative">
        <button
          onClick={() => setShowEdit(true)}
          className="rounded-2xl py-4 flex items-center justify-center gap-2 transition-transform active:scale-[0.97]"
          style={{ backgroundColor: COLORS.gold }}
        >
          <Edit3 size={16} color={COLORS.ink} />
          <span className="font-body font-semibold text-[14px]" style={{ color: COLORS.ink }}>
            Edit Event
          </span>
        </button>
        <div>
          <DeleteButton
            label="Remove"
            onDelete={handleRemove}
            dark
          />
        </div>
        {toast && (
          <span className="anim-toast absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-body font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS.creamCard, color: COLORS.ink }} role="status">
            {toast}
          </span>
        )}
      </div>

      <AddEventModal open={showEdit} onClose={() => setShowEdit(false)} event={event} />
    </div>
  );
}
