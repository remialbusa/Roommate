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
