import { createContext, useContext } from "react";

/**
 * Shared state interface for both backends: the local
 * (localStorage) provider and the Supabase provider expose the
 * same { state, actions, currentUser, needsHousehold } shape, so
 * every screen works unchanged in either mode.
 */
const AppStateContext = createContext(null);

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within an AppState provider");
  return ctx;
}

export default AppStateContext;
