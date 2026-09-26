import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";
import { GroupedList } from "./ActivityRow";

export default function RoommateActivity({ roommateId, onBack }) {
  const { state } = useAppState();
  const person = state.users[roommateId];
  const entries = state.activityLog.filter((e) => e.roommate === roommateId);

  if (!person) {
    return (
      <div className="rounded-[32px] p-6" style={{ backgroundColor: COLORS.ink }}>
        <ScreenHeader title="Roommate Activity" onBack={onBack} dark />
        <p className="font-body text-[14px]" style={{ color: "#F1ECDC" }}>
          This roommate is no longer in the household.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] p-6 pb-8 flex flex-col gap-5" style={{ backgroundColor: COLORS.ink }}>
      <ScreenHeader title="Roommate Activity" onBack={onBack} dark />

      <div className="flex flex-col items-center text-center">
        <Avatar bg={person.bg} name={person.name} size={72} />
        <h2 className="font-display font-bold text-[19px] mt-3 truncate max-w-full" style={{ color: "#F1ECDC" }}>
          {person.name}
        </h2>
        <p className="font-body text-[13px] mt-0.5" style={{ color: "rgba(241,236,220,0.5)" }}>
          {entries.length} recent {entries.length === 1 ? "action" : "actions"}
        </p>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(241,236,220,0.06)" }}>
        <GroupedList entries={entries} showName={false} />
      </div>
    </div>
  );
}
