import { CheckCircle2, Coins, FileText, CalendarDays, UserPlus, Activity } from "lucide-react";
import { COLORS } from "../../theme";

export const CATEGORY_META = {
  bills: { icon: CheckCircle2, color: COLORS.lime, label: "Bills" },
  lending: { icon: Coins, color: COLORS.gold, label: "Lending" },
  notes: { icon: FileText, color: COLORS.ember, label: "Notes" },
  calendar: { icon: CalendarDays, color: COLORS.lime, label: "Calendar" },
  account: { icon: UserPlus, color: COLORS.gold, label: "Account" },
};

export const FALLBACK_META = { icon: Activity, color: COLORS.creamCard, label: "Activity" };

export const FILTERS = ["All", "Bills", "Lending", "Notes", "Calendar", "Account"];
