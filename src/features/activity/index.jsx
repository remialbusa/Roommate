import { useState } from "react";
import ActivityFeed from "./ActivityFeed";
import RoommateActivity from "./RoommateActivity";

export default function ActivityFeature() {
  const [screen, setScreen] = useState("feed");
  const [activeRoommate, setActiveRoommate] = useState(null);

  if (screen === "roommate") {
    return (
      <div key="roommate" className="anim-screen">
        <RoommateActivity roommateId={activeRoommate} onBack={() => setScreen("feed")} />
      </div>
    );
  }
  return (
    <div key="feed" className="anim-screen">
      <ActivityFeed
        onOpenRoommate={(id) => {
          setActiveRoommate(id);
          setScreen("roommate");
        }}
      />
    </div>
  );
}
