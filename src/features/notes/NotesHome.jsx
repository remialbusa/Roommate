import { useState } from "react";
import { Plus, Search, Pin, X } from "lucide-react";
import HouseholdButton from "../../components/HouseholdButton";
import Avatar from "../../components/Avatar";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import AddNoteModal from "./AddNoteModal";

const COLOR_MAP = { gold: COLORS.gold, lime: COLORS.lime, ember: COLORS.ember };

export default function NotesHome({ onOpenNote }) {
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { state } = useAppState();
  const { notes, users } = state;

  const q = query.trim().toLowerCase();
  const matches = (n) =>
    q === "" || n.title.toLowerCase().includes(q) || (n.body || "").toLowerCase().includes(q);
  const pinned = notes.filter((n) => n.pinned && matches(n));
  const rest = notes.filter((n) => !n.pinned && matches(n));

  return (
    <div className="rounded-[32px] p-6 pb-28 flex flex-col gap-5 relative" style={{ backgroundColor: COLORS.ink }}>
      <div className="flex items-center justify-between">
        <Logo />
        <HouseholdButton />
      </div>

      <h1 className="font-display font-semibold text-[34px] leading-[1.05]" style={{ color: "#F1ECDC" }}>
        Shared
        <br />
        Notes
      </h1>

      <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: "rgba(241,236,220,0.08)" }}>
        <Search size={16} color="rgba(241,236,220,0.5)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles and contents"
          aria-label="Search notes"
          className="bg-transparent outline-none font-body text-[14px] flex-1 placeholder:text-[rgba(241,236,220,0.4)]"
          style={{ color: "#F1ECDC" }}
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0">
            <X size={15} color="rgba(241,236,220,0.6)" />
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "rgba(241,236,220,0.06)" }}>
          <p className="font-display font-bold text-[18px] mb-1" style={{ color: "#F1ECDC" }}>
            No notes yet
          </p>
          <p className="font-body text-[13px]" style={{ color: "rgba(241,236,220,0.55)" }}>
            Pin Wi-Fi codes, schedules, and house rules here.
          </p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="flex flex-col gap-3">
              {pinned.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => onOpenNote(p.id)}
                  className="anim-item rounded-2xl p-5 text-left transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: COLOR_MAP[p.color] || COLORS.gold, animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Pin size={13} color={COLORS.ink} />
                    <span className="font-body font-semibold text-[12px] uppercase tracking-wide" style={{ color: COLORS.ink, opacity: 0.7 }}>
                      Pinned
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[18px] mb-1 line-clamp-2" style={{ color: COLORS.ink }}>
                    {p.title}
                  </h3>
                  <p className="font-body text-[13px] leading-snug line-clamp-2" style={{ color: "rgba(18,49,40,0.75)" }}>
                    {(p.body || "").split("\n")[0]}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {rest.map((n, i) => (
              <button
                key={n.id}
                onClick={() => onOpenNote(n.id)}
                className="anim-item rounded-2xl p-4 text-left flex items-start gap-3 transition-transform active:scale-[0.98]"
                style={{ backgroundColor: "rgba(241,236,220,0.06)", animationDelay: `${Math.min(i + pinned.length, 8) * 45}ms` }}
              >
                <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: COLOR_MAP[n.color] || COLORS.gold }} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-body font-semibold text-[14.5px] mb-0.5 truncate" style={{ color: "#F1ECDC" }}>
                    {n.title}
                  </h4>
                  <p className="font-body text-[12.5px] truncate" style={{ color: "rgba(241,236,220,0.5)" }}>
                    {(n.body || "").split("\n")[0]}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Avatar bg={users[n.author]?.bg} name={users[n.author]?.name} size={18} />
                    <span className="font-body text-[11.5px] truncate" style={{ color: "rgba(241,236,220,0.45)" }}>
                      {users[n.author]?.name ?? "Unknown"} · {n.time}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {rest.length === 0 && pinned.length === 0 && (
              <p className="font-body text-[13px] text-center py-6" style={{ color: "rgba(241,236,220,0.4)" }}>
                {q ? `No notes match "${query.trim()}"` : "No notes here yet."}
              </p>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="anim-item absolute bottom-6 right-6 h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-[1.04] active:scale-90 focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
        style={{ backgroundColor: COLORS.lime }}
        aria-label="Add note"
      >
        <Plus size={24} color={COLORS.ink} />
      </button>

      <AddNoteModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
