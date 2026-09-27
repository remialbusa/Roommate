import { useState } from "react";
import CalendarHome from "./CalendarHome";
import EventDetail from "./EventDetail";

export default function CalendarFeature({ onOpenBill, onOpenLoan, onOpenNote }) {
  const [screen, setScreen] = useState("home");
  const [activeEvent, setActiveEvent] = useState(null);

  if (screen === "event") {
    return <EventDetail eventId={activeEvent} onBack={() => setScreen("home")} />;
  }
  return (
    <CalendarHome
      onOpenEvent={(id) => {
        setActiveEvent(id);
        setScreen("event");
      }}
      onOpenBill={onOpenBill}
      onOpenLoan={onOpenLoan}
      onOpenNote={onOpenNote}
    />
  );
}
