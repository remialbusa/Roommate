import { useAppState } from "../state/AppStateContext";

export const CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "PHP", label: "Philippine Peso", symbol: "₱" },
];

export function isCurrency(code) {
  return CURRENCIES.some((c) => c.code === code);
}

export function formatMoney(n, currency = "USD") {
  const code = isCurrency(currency) ? currency : "USD";
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: code });
  const num = Number(n);
  return fmt.format(Number.isFinite(num) ? num : 0);
}

/** @deprecated Use formatMoney(n, currency) or the useMoney() hook. */
export function formatUSD(n) {
  return formatMoney(n, "USD");
}

export function formatUSDCompact(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0";
  if (Number.isInteger(num)) return `$${num.toLocaleString("en-US")}`;
  return formatUSD(num);
}

/** Formatter bound to the household's selected currency. */
export function useMoney() {
  const { state } = useAppState();
  const currency = isCurrency(state.settings?.currency) ? state.settings.currency : "USD";
  const symbol = (CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]).symbol;
  return { currency, symbol, money: (n) => formatMoney(n, currency) };
}

export function loanStatus(loan) {
  return loan?.status || "confirmed";
}

export function loanRemaining(loan) {
  if (!loan) return 0;
  const repaid = (loan.repayments || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  return Math.max(0, Number(loan.amount || 0) - repaid);
}

export function billShare(bill) {
  const ids = Object.keys(bill?.splits || {});
  if (ids.length === 0) return 0;
  return Number(bill.amount || 0) / ids.length;
}

export const RECURRENCES = ["None", "Weekly", "Monthly"];

function parseYMD(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export { parseYMD };

export function ymdParts(s) {
  const d = parseYMD(s);
  if (!d) return null;
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
}

/** "Oct 1" (adds year when outside the current year). Empty string when invalid. */
export function formatDateLabel(s) {
  const d = parseYMD(s);
  if (!d) return "";
  const now = new Date();
  const opts = { month: "short", day: "numeric" };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("en-US", opts);
}

export function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayYMD() {
  return toYMD(new Date());
}

/** "Oct 1" style label; falls back to legacy free-text due. */
export function formatBillDue(bill) {
  const d = parseYMD(bill?.dueDate);
  if (!d) return bill?.due || "This month";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Next occurrence for a recurring bill, or null when not recurring. */
export function nextDueDate(bill) {
  const d = parseYMD(bill?.dueDate);
  if (!d) return null;
  const origDay = d.getDate();
  if (bill.recurrence === "Weekly") {
    d.setDate(d.getDate() + 7);
    return toYMD(d);
  }
  if (bill.recurrence === "Monthly") {
    d.setMonth(d.getMonth() + 1);
    if (d.getDate() !== origDay) d.setDate(0); // clamp to month end
    return toYMD(d);
  }
  return null;
}

/** Sort key: dated bills first by date, undated keep insertion order. */
export function dueSortKey(bill, index) {
  const d = parseYMD(bill?.dueDate);
  return d ? d.getTime() : Number.MAX_SAFE_INTEGER - 100000 + index;
}
