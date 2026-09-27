import { useState } from "react";
import NotesHome from "./NotesHome";
import NoteDetail from "./NoteDetail";

export default function NotesFeature({ screen, activeNote, onNavigate }) {
  if (screen === "note") {
    return <NoteDetail noteId={activeNote} onBack={() => onNavigate("home")} />;
  }
  return <NotesHome onOpenNote={(id) => onNavigate("note", id)} />;
}
