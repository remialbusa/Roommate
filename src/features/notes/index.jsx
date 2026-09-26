import { useState } from "react";
import NotesHome from "./NotesHome";
import NoteDetail from "./NoteDetail";

export default function NotesFeature() {
  const [screen, setScreen] = useState("home");
  const [activeNote, setActiveNote] = useState(null);

  if (screen === "note") {
    return (
      <div key="note" className="anim-screen">
        <NoteDetail noteId={activeNote} onBack={() => setScreen("home")} />
      </div>
    );
  }
  return (
    <div key="home" className="anim-screen">
      <NotesHome
        onOpenNote={(id) => {
          setActiveNote(id);
          setScreen("note");
        }}
      />
    </div>
  );
}
