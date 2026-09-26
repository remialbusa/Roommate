import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock3 } from "lucide-react";
import HouseholdButton from "../../components/HouseholdButton";
import Avatar from "../../components/Avatar";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { WEEKDAYS, MONTH_NAMES, getMonthGrid } from "./data";
import AddEventModal from "./AddEventModal";

const COLOR_MAP = { gold: COLORS.gold, lime: COLORS.lime, ember: COLORS.ember };

export default function CalendarHome({ onOpenEvent }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showAdd, setShowAdd] = useState(false);
  const [prefillDay, setPrefillDay] = useState(null);
  const { state } = useAppState();
  const { events, users } = state;

  const cells = getMonthGrid(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const eventsByDay = events.reduce((acc, e) => {
    const d = Number(e.day);
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});
  const upcoming = [...events].sort((a, b) => Number(a.day) - Number(b.day));

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  function handleDayClick(day) {
    const list = eventsByDay[day];
    if (list && list.length === 1) onOpenEvent(list[0].id);
    else if (list && list.length > 1) onOpenEvent(list[0].id);
    else {
      setPrefillDay(day);
      setShowAdd(true);
    }
  }

  return (
    <div className="rounded-[32px] p-6 pb-28 flex flex-col gap-5 relative" style={{ backgroundColor: COLORS.ink }}>
      <div className="flex items-center justify-between">
        <Logo />
        <HouseholdButton />
      </div>

      <h1 className="font-display font-semibold text-[34px] leading-[1.05]" style={{ color: "#F1ECDC" }}>
        House
        <br />
        Calendar
      </h1>

      <div className="rounded-2xl p-5" style={{ backgroundColor: COLORS.gold }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="h-8 w-8 rounded-full flex items-center justify-center transition-transform active:scale-90" style={{ backgroundColor: "rgba(18,49,40,0.1)" }}>
            <ChevronLeft size={16} color={COLORS.ink} />
          </button>
          <span className="font-display font-bold text-[16px]" style={{ color: COLORS.ink }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" className="h-8 w-8 rounded-full flex items-center justify-center transition-transform active:scale-90" style={{ backgroundColor: "rgba(18,49,40,0.1)" }}>
            <ChevronRight size={16} color={COLORS.ink} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center font-body font-semibold text-[11px]" style={{ color: "rgba(18,49,40,0.5)" }}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((day, i) => {
            const isToday = isCurrentMonth && day === today.getDate();
            const dayEvents = day ? eventsByDay[day] || [] : [];
            const hasEvents = dayEvents.length > 0;
            return (
              <button
                key={i}
                disabled={!day}
                onClick={() => day && handleDayClick(day)}
                title={day ? (hasEvents ? `${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"} — tap to open` : `No events on ${day} — tap to add one`) : undefined}
                aria-label={day ? `${MONTH_NAMES[month]} ${day}${hasEvents ? `, ${dayEvents.length} events, tap to open` : ", no events, tap to add"}` : undefined}
                className="anim-item h-10 flex flex-col items-center justify-center relative rounded-lg transition-colors hover:bg-[rgba(18,49,40,0.08)] focus-visible:outline-2 focus-visible:outline-[#123128]"
                style={{ animationDelay: `${Math.min(i, 12) * 12}ms` }}
              >
                {day && (
                  <>
                    <span
                      className="h-7 min-w-7 px-1 rounded-full flex items-center justify-center font-body font-semibold text-[12.5px]"
                      style={{
                        backgroundColor: isToday ? COLORS.ink : hasEvents ? COLORS.ink : "transparent",
                        color: isToday || hasEvents ? "#F1ECDC" : COLORS.ink,
                      }}
                    >
                      {day}
                    </span>
                    {hasEvents && !isToday && (
                      <span className="font-body font-semibold text-[9px] leading-none mt-0.5" style={{ color: COLORS.ink, opacity: 0.65 }}>
                        {dayEvents.length > 1 ? `${dayEvents.length} events` : dayEvents[0].title.slice(0, 8)}
                      </span>
                    )}
                    {hasEvents && isToday && (
                      <span className="flex gap-0.5 absolute bottom-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span key={e.id} className="h-1 w-1 rounded-full" style={{ backgroundColor: "#F1ECDC" }} />
                        ))}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
        <p className="font-body text-[11.5px] mt-1" style={{ color: "rgba(18,49,40,0.55)" }}>
          Dark days have events — tap to open. Empty days — tap to add.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-display font-semibold text-[15px] px-1" style={{ color: "#F1ECDC" }}>
          Upcoming · {MONTH_NAMES[month].slice(0, 3)} {year}
        </h3>
        {upcoming.map((e, i) => (
          <button
            key={e.id}
            onClick={() => onOpenEvent(e.id)}
            className="anim-item rounded-2xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.98]"
            style={{ backgroundColor: "rgba(241,236,220,0.06)", animationDelay: `${Math.min(i, 8) * 45}ms` }}
          >
            <div className="h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: COLOR_MAP[e.color] || COLORS.gold }}>
              <span className="font-display font-bold text-[15px] leading-none" style={{ color: COLORS.ink }}>
                {e.day}
              </span>
              <span className="font-body text-[9px] uppercase" style={{ color: COLORS.ink, opacity: 0.7 }}>
                {MONTH_NAMES[month].slice(0, 3)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
                {e.title}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock3 size={11} color="rgba(241,236,220,0.5)" />
                <span className="font-body text-[12px] truncate" style={{ color: "rgba(241,236,220,0.5)" }}>
                  {e.time}
                </span>
              </div>
            </div>
            <div className="flex -space-x-2 shrink-0">
              {(e.people || []).slice(0, 3).map((id) => (
                <Avatar key={id} bg={users[id]?.bg} name={users[id]?.name} size={26} />
              ))}
            </div>
          </button>
        ))}
        {upcoming.length === 0 && (
          <p className="font-body text-[13px] text-center py-6" style={{ color: "rgba(241,236,220,0.4)" }}>
            No events yet — tap + to add one{isCurrentMonth ? " for this month" : ""}.
          </p>
        )}
      </div>

      <button
        onClick={() => {
          setPrefillDay(null);
          setShowAdd(true);
        }}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-[1.04] active:scale-90"
        style={{ backgroundColor: COLORS.lime }}
        aria-label="Add event"
      >
        <Plus size={24} color={COLORS.ink} />
      </button>

      <AddEventModal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setPrefillDay(null);
        }}
        daysInMonth={new Date(year, month + 1, 0).getDate()}
        prefillDay={prefillDay}
      />
    </div>
  );
}
