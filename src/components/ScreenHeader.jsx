import { ChevronLeft } from "lucide-react";
import IconButton from "./IconButton";
import HouseholdButton from "./HouseholdButton";
import { COLORS } from "../theme";

/**
 * Shared page header used by every "detail" screen: back chevron,
 * centered title, and a right-hand action. By default the right
 * side opens the Household roster modal; screens that need
 * something else (e.g. an edit button) pass `right`.
 */
export default function ScreenHeader({ title, onBack, dark = false, right }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 pb-5">
      {onBack ? (
        <IconButton
          icon={<ChevronLeft size={20} />}
          onClick={onBack}
          tone={dark ? "dark" : "cream"}
          ariaLabel="Go back"
        />
      ) : (
        <div className="h-11 w-11" />
      )}
      {title && (
        <h1
          className="font-display font-semibold text-[17px] truncate flex-1 text-center px-1"
          style={{ color: dark ? "#F1ECDC" : COLORS.ink }}
          title={title}
        >
          {title}
        </h1>
      )}
      {right ?? <HouseholdButton tone={dark ? "dark" : "cream"} />}
    </div>
  );
}
