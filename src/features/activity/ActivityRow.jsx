import { ChevronRight } from "lucide-react";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { CATEGORY_META, FALLBACK_META } from "./data";

export function ActivityRow({ entry, showName, onOpenRoommate }) {
  const { state } = useAppState();
  const meta = CATEGORY_META[entry.category] || FALLBACK_META;
  const Icon = meta.icon;
  const person = state.users[entry.roommate];
  const clickable = Boolean(person) && typeof onOpenRoommate === "function";

  const inner = (
    <>
      <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color }}>
        <Icon size={16} color={COLORS.ink} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[13.5px] leading-snug break-words" style={{ color: "#F1ECDC" }}>
          {showName && <span className="font-semibold">{person?.name ?? "Someone"} </span>}
          {entry.action}
        </p>
      </div>
      <span className="font-body text-[11.5px] shrink-0" style={{ color: "rgba(241,236,220,0.45)" }}>
        {entry.time}
      </span>
    </>
  );

  if (!clickable) {
    return <div className="flex items-center gap-3 w-full text-left">{inner}</div>;
  }
  return (
    <button
      onClick={() => onOpenRoommate(entry.roommate)}
      title={`View ${person?.name ?? "roommate"}'s activity`}
      className="flex items-center gap-3 w-full text-left rounded-xl px-2 -mx-2 py-1 transition-colors hover:bg-[rgba(241,236,220,0.06)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
    >
      {inner}
      <ChevronRight size={15} color="rgba(241,236,220,0.4)" className="shrink-0" />
    </button>
  );
}

export function GroupedList({ entries, showName, onOpenRoommate }) {
  let lastDay = null;
  return (
    <div className="flex flex-col gap-4">
      {entries.map((e, i) => {
        const isNewGroup = e.day !== lastDay;
        lastDay = e.day;
        return (
          <div key={e.id} className="anim-item flex flex-col gap-3" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
            {isNewGroup && (
              <span className="font-body font-semibold text-[12.5px]" style={{ color: "rgba(241,236,220,0.4)" }}>
                {e.day}
              </span>
            )}
            <ActivityRow entry={e} showName={showName} onOpenRoommate={onOpenRoommate} />
          </div>
        );
      })}
      {entries.length === 0 && (
        <p className="font-body text-[13px] text-center py-8" style={{ color: "rgba(241,236,220,0.4)" }}>
          No activity here yet — bills, loans, notes, and events will show up automatically.
        </p>
      )}
    </div>
  );
}
