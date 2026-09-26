import { useState } from "react";
import AppShell from "./components/AppShell";
import SettingsModal from "./components/SettingsModal";
import { AppStateProvider, useAppState } from "./state/AppStateContext";
import AuthScreen from "./features/auth/AuthScreen";
import BillsFeature from "./features/bills";
import LendingFeature from "./features/lending";
import NotesFeature from "./features/notes";
import CalendarFeature from "./features/calendar";
import ActivityFeature from "./features/activity";

const FEATURES = {
  bills: BillsFeature,
  lending: LendingFeature,
  notes: NotesFeature,
  calendar: CalendarFeature,
  activity: ActivityFeature,
};

function AppContent() {
  const { currentUser } = useAppState();
  const [active, setActive] = useState("bills");

  if (!currentUser) {
    return <AuthScreen />;
  }

  const ActiveFeature = FEATURES[active];
  return (
    <>
      <AppShell active={active} onChangeActive={setActive}>
        <div key={active} className="anim-screen">
          <ActiveFeature />
        </div>
      </AppShell>
      <SettingsModal />
    </>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
