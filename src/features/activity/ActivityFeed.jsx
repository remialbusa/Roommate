import { useState } from "react";
import Logo from "../../components/Logo";
import HouseholdButton from "../../components/HouseholdButton";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { CATEGORY_META, FILTERS } from "./data";
import { GroupedList } from "./ActivityRow";

export default function ActivityFeed({ onOpenRoommate }) {
  const [filter, setFilter] = useState("All");
  const { state } = useAppState();
  const filtered = state.activityLog.filter((e) => filter === "All" || (CATEGORY_META[e.category]?.label ?? "Activity") === filter);

  return (
    <div className="rounded-[32px] p-6 pb-8 flex flex-col gap-5" style={{ backgroundColor: COLORS.ink }}>
      <div className="flex items-center justify-between">
        <Logo />
        <HouseholdButton />
      </div>

      <h1 className="font-display font-semibold text-[34px] leading-[1.05]" style={{ color: "#F1ECDC" }}>
        Activity
        <br />
        Log
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 app-scroll" role="group" aria-label="Filter activity">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={f === filter}
            className="px-4 py-2 rounded-full font-body font-semibold text-[13px] shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#8FE84F]"
            style={{ backgroundColor: f === filter ? COLORS.lime : "rgba(241,236,220,0.08)", color: f === filter ? COLORS.ink : "rgba(241,236,220,0.7)" }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(241,236,220,0.06)" }}>
        <GroupedList entries={filtered} showName onOpenRoommate={onOpenRoommate} />
      </div>
    </div>
  );
}
