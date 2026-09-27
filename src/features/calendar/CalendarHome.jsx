import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, ReceiptText, Coins, FileText, CalendarDays, ChevronRight as Chevron } from "lucide-react";
import HouseholdButton from "../../components/HouseholdButton";
import Avatar from "../../components/Avatar";
import Logo from "../../components/Logo";
import Modal from "../../components/Modal";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { WEEKDAYS, MONTH_NAMES, getMonthGrid } from "./data";
import { ymdParts, todayYMD, useMoney } from "../../utils/format";
import AddEventModal from "./AddEventModal";

const COLOR_MAP = { gold: COLORS.gold, lime: COLORS.lime, ember: COLORS.ember };

const TYPE_META = {
  event: { icon: CalendarDays, label: "Event" },
  bill: { icon: ReceiptText, label: "Bill due" },
  loan: { icon: Coins, label: "Loan" },
  note: { icon: FileText, label: "Note" },
};

const TYPE_DOT = { bill: COLORS.ember, loan: COLORS.lime, note: "#F1ECDC" };

function tileBg(item) {
  if (item.type === "event") return COLOR_MAP[item.color] || COLORS.gold;
  if (item.type === "bill") return COLORS.ember;
  if (item.type === "loan") return COLORS.lime;
  return "rgba(241,236,220,0.15)";
}

function tileFg(item) {
  if (item.type === "bill") return "#F1ECDC";
  if (item.type === "note") return "#F1ECDC";
  return COLORS.ink;
}

export default function CalendarHome({ onOpenEvent, onOpenBill, onOpenLoan, onOpenNote }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showAdd, setShowAdd] = useState(false);
  const [prefillDay, setPrefillDay] = useState(null);
  const [sheetDay, setSheetDay] = useState(null);
  const { state } = useAppState();
  const { money } = useMoney();
  const { bills, loans, notes, events, users } = state;

  const cells = getMonthGrid(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const inViewedMonth = (ymd) => {
    const p = ymdParts(ymd);
    return Boolean(p && p.y === year && p.m === month);
  };

  // Every dated thing in the viewed month, grouped by day.
  const itemsByDay = {};
  function push(day, item) {
    const d = Number(day);
    if (!d) return;
    if (!itemsByDay[d]) itemsByDay[d] = [];
    itemsByDay[d].push(item);
  }
  for (const e of events) push(e.day, { type: "event", id: e.id, title: e.title, sub: e.time, color: e.color });
  for (const b of bills) {
    const p = ymdParts(b.dueDate);
    if (p && p.y === year && p.m === month) {
      push(p.d, { type: "bill", id: b.id, title: b.name, sub: `${money(b.amount)} due`, y: p.y, m: p.m, d: p.d });
    }
  }
  for (const l of loans) {
    const p = ymdParts(l.loanDate);
    if (p && p.y === year && p.m === month) {
      push(p.d, { type: "loan", id: l.id, title: l.title, sub: money(l.amount), y: p.y, m: p.m, d: p.d });
    }
  }
  for (const n of notes) {
    const p = ymdParts(n.noteDate);
    if (p && p.y === year && p.m === month) {
      push(p.d, { type: "note", id: n.id, title: n.title, sub: (n.body || "").split("\n")[0], y: p.y, m: p.m, d: p.d });
    }
  }

  // Agenda: dated items from today onward (any month) + this month's events.
  const todayStr = todayYMD();
  const agenda = [];
  for (const b of bills) {
    if (b.dueDate && b.dueDate >= todayStr) {
      const p = ymdParts(b.dueDate);
      if (p) agenda.push({ type: "bill", id: b.id, title: b.name, sub: `${money(b.amount)} due`, y: p.y, m: p.m, d: p.d });
    }
  }
  for (const l of loans) {
    if (l.loanDate && l.loanDate >= todayStr) {
      const p = ymdParts(l.loanDate);
      if (p) agenda.push({ type: "loan", id: l.id, title: l.title, sub: money(l.amount), y: p.y, m: p.m, d: p.d });
    }
  }
  for (const n of notes) {
    if (n.noteDate && n.noteDate >= todayStr) {
      const p = ymdParts(n.noteDate);
      if (p) agenda.push({ type: "note", id: n.id, title: n.title, sub: (n.body || "").split("\n")[0], y: p.y, m: p.m, d: p.d });
    }
  }
  for (const e of events) {
    agenda.push({ type: "event", id: e.id, title: e.title, sub: e.time, color: e.color, people: e.people, y: year, m: month, d: Number(e.day) });
  }
  agenda.sort((a, b) => a.y - b.y || a.m - b.m || a.d - b.d);
  const upcoming = agenda.slice(0, 12);

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

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  function openItem(item) {
    setSheetDay(null);
    if (item.type === "event") onOpenEvent(item.id);
    else if (item.type === "bill" && onOpenBill) onOpenBill(item.id);
    else if (item.type === "loan" && onOpenLoan) onOpenLoan(item.id);
    else if (item.type === "note" && onOpenNote) onOpenNote(item.id);
  }

  function handleDayClick(day) {
    const list = itemsByDay[day] || [];
    if (list.length === 0) {
      setPrefillDay(day);
      setShowAdd(true);
    } else if (list.length === 1) {
      openItem(list[0]);
    } else {
      setSheetDay(day);
    }
  }

  function AgendaRow({ item, index }) {
    const Meta = TYPE_META[item.type].icon;
    return (
      <button
        key={`${item.type}-${item.id}`}
        onClick={() => openItem(item)}
        className="anim-item rounded-2xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
        style={{ backgroundColor: "rgba(241,236,220,0.06)", animationDelay: `${Math.min(index, 8) * 45}ms` }}
      >
        <div className="h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: tileBg(item) }}>
          <span className="font-display font-bold text-[15px] leading-none" style={{ color: tileFg(item) }}>
            {item.d}
          </span>
          <span className="font-body text-[9px] uppercase" style={{ color: tileFg(item), opacity: 0.7 }}>
            {MONTH_NAMES[item.m].slice(0, 3)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: "#F1ECDC" }}>
            {item.title}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Meta size={11} color="rgba(241,236,220,0.5)" />
            <span className="font-body text-[12px] truncate" style={{ color: "rgba(241,236,220,0.5)" }}>
              {TYPE_META[item.type].label} · {item.sub}
            </span>
          </div>
        </div>
        {item.type === "event" && (
          <div className="flex -space-x-2 shrink-0">
            {(item.people || []).slice(0, 3).map((id) => (
              <Avatar key={id} bg={users[id]?.bg} name={users[id]?.name} size={26} />
            ))}
          </div>
        )}
        <Chevron size={15} color="rgba(241,236,220,0.4)" className="shrink-0" />
      </button>
    );
  }

  const sheetItems = sheetDay ? itemsByDay[sheetDay] || [] : [];

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
          <button onClick={goToday} title="Jump to today" aria-label="Jump to today" className="font-display font-bold text-[16px] rounded-lg px-2 focus-visible:outline-2 focus-visible:outline-[#123128]" style={{ color: COLORS.ink }}>
            {MONTH_NAMES[month]} {year}
          </button>
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
            const dayItems = day ? itemsByDay[day] || [] : [];
            const hasItems = dayItems.length > 0;
            const dots = [];
            for (const it of dayItems) {
              const c = it.type === "event" ? COLOR_MAP[it.color] || COLORS.ink : TYPE_DOT[it.type];
              if (c && !dots.includes(c)) dots.push(c);
            }
            return (
              <button
                key={i}
                disabled={!day}
                onClick={() => day && handleDayClick(day)}
                title={day ? (hasItems ? `${dayItems.length} ${dayItems.length === 1 ? "item" : "items"} — tap to open` : `Nothing on ${day} — tap to add an event`) : undefined}
                aria-label={day ? `${MONTH_NAMES[month]} ${day}${hasItems ? `, ${dayItems.length} items, tap to open` : ", nothing scheduled, tap to add"}` : undefined}
                className="anim-item h-10 flex flex-col items-center justify-center relative rounded-lg transition-colors hover:bg-[rgba(18,49,40,0.08)] focus-visible:outline-2 focus-visible:outline-[#123128]"
                style={{ animationDelay: `${Math.min(i, 12) * 12}ms` }}
              >
                {day && (
                  <>
                    <span
                      className="h-7 min-w-7 px-1 rounded-full flex items-center justify-center font-body font-semibold text-[12.5px]"
                      style={{
                        backgroundColor: isToday ? COLORS.ink : hasItems ? COLORS.ink : "transparent",
                        color: isToday || hasItems ? "#F1ECDC" : COLORS.ink,
                      }}
                    >
                      {day}
                    </span>
                    {dots.length > 0 && (
                      <span className="flex gap-0.5 absolute bottom-0.5">
                        {dots.slice(0, 3).map((c) => (
                          <span key={c} className="h-1 w-1 rounded-full" style={{ backgroundColor: isToday ? "#F1ECDC" : c }} />
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
          Dark days hold bills, loans, notes or events — tap to open. Empty days — tap to add. Tap the month to jump back to today.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-display font-semibold text-[15px] px-1" style={{ color: "#F1ECDC" }}>
          Upcoming
        </h3>
        {upcoming.map((item, i) => (
          <AgendaRow key={`${item.type}-${item.id}`} item={item} index={i} />
        ))}
        {upcoming.length === 0 && (
          <p className="font-body text-[13px] text-center py-6" style={{ color: "rgba(241,236,220,0.4)" }}>
            Nothing coming up — log a bill or loan, or tap + to add an event.
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

      <Modal open={sheetDay !== null} onClose={() => setSheetDay(null)} title={sheetDay ? `${MONTH_NAMES[month]} ${sheetDay}` : "Day"}>
        <div className="flex flex-col gap-2.5">
          {sheetItems.map((item) => {
            const Meta = TYPE_META[item.type].icon;
            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => openItem(item)}
                className="rounded-2xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.98]"
                style={{ backgroundColor: "rgba(18,49,40,0.05)" }}
              >
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tileBg(item) }}>
                  <Meta size={16} color={tileFg(item)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: COLORS.ink }}>
                    {item.title}
                  </div>
                  <div className="font-body text-[12px] truncate" style={{ color: "rgba(18,49,40,0.55)" }}>
                    {TYPE_META[item.type].label} · {item.sub}
                  </div>
                </div>
                <Chevron size={15} color="rgba(18,49,40,0.4)" className="shrink-0" />
              </button>
            );
          })}
        </div>
      </Modal>

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
