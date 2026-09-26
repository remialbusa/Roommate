import { Users } from "lucide-react";
import IconButton from "./IconButton";
import { useAppState } from "../state/AppStateContext";

/**
 * Opens the Household roster modal. Rendered in screen headers for
 * mobile, where there is no sidebar — hidden on desktop (md+) since
 * the sidebar already carries the household entry.
 */
export default function HouseholdButton({ tone = "cream" }) {
  const { actions } = useAppState();
  return (
    <div className="md:hidden">
      <IconButton icon={<Users size={17} />} tone={tone} ariaLabel="Household members" onClick={actions.openSettings} />
    </div>
  );
}
