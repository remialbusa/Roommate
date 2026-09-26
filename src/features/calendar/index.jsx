import { useState } from "react";
import CalendarHome from "./CalendarHome";
import EventDetail from "./EventDetail";

export default function CalendarFeature() {
  const [screen, setScreen] = useState("home");
  const [activeEvent, setActiveEvent] = useState(null);

  if (screen === "event") {
    return (
      <div key="event" className="anim-screen">
        <EventDetail eventId={activeEvent} onBack={() => setScreen("home")} />
      </div>
    );
  }
  return (
    <div key="home" className="anim-screen">
      <CalendarHome
        onOpenEvent={(id) => {
          setActiveEvent(id);
          setScreen("event");
        }}
      />
    </div>
  );
}
