import { useState } from "react";
import AppShell from "./components/AppShell";
import SettingsModal from "./components/SettingsModal";
import Splash from "./components/Splash";
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

function AppContent() {
  const { currentUser, needsHousehold, ready } = useAppState();
  // Owned navigation: any screen (e.g. a calendar agenda row) can
  // deep-link to any other tab's detail screen.
  const [nav, setNav] = useState({ tab: "bills", screen: "home", id: null });

  if (!ready) {
    return <Splash />;
  }

  if (!currentUser) {
    // Online: signed in but no household yet → setup screen.
    if (needsHousehold) return <HouseholdSetup />;
    return <AuthScreen />;
  }

  function goTab(tab) {
    setNav({ tab, screen: "home", id: null });
  }

  return (
    <>
      <AppShell active={nav.tab} onChangeActive={goTab}>
        <div key={nav.tab + nav.screen} className="anim-screen">
          {nav.tab === "bills" && (
            <BillsFeature
              screen={nav.screen}
              activeBill={nav.id}
              onNavigate={(screen, id) => setNav({ tab: "bills", screen, id: id ?? null })}
            />
          )}
          {nav.tab === "lending" && (
            <LendingFeature
              screen={nav.screen}
              activeLoan={nav.id}
              onNavigate={(screen, id) => setNav({ tab: "lending", screen, id: id ?? null })}
            />
          )}
          {nav.tab === "notes" && (
            <NotesFeature
              screen={nav.screen}
              activeNote={nav.id}
              onNavigate={(screen, id) => setNav({ tab: "notes", screen, id: id ?? null })}
            />
          )}
          {nav.tab === "calendar" && (
            <CalendarFeature
              onOpenBill={(id) => setNav({ tab: "bills", screen: "bill", id })}
              onOpenLoan={(id) => setNav({ tab: "lending", screen: "loan", id })}
              onOpenNote={(id) => setNav({ tab: "notes", screen: "note", id })}
            />
          )}
          {nav.tab === "activity" && <ActivityFeature />}
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
