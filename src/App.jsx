import { useState } from "react";
import AppShell from "./components/AppShell";
import SettingsModal from "./components/SettingsModal";
import { AppStateProvider, useAppState } from "./state/AppStateContext";
import { SupabaseStateProvider } from "./state/SupabaseState";
import { isOnline } from "./lib/supabase";
import AuthScreen from "./features/auth/AuthScreen";
import HouseholdSetup from "./features/auth/HouseholdSetup";
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
  const { currentUser, needsHousehold } = useAppState();
  const [active, setActive] = useState("bills");

  if (!currentUser) {
    // Online: signed in but no household yet → setup screen.
    if (needsHousehold) return <HouseholdSetup />;
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
  // Online mode (Supabase env vars present) syncs one shared household
  // across devices; otherwise the app runs on local browser storage.
  if (isOnline()) {
    return (
      <SupabaseStateProvider>
        <AppContent />
      </SupabaseStateProvider>
    );
  }
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
