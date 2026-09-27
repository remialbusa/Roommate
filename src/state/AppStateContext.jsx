import { useEffect, useReducer } from "react";
import AppStateContext, { useAppState } from "./appContext";

/* ---------------------------------------------------------------
   Single source of truth: household accounts, bills, loans,
   notes, events, and a derived activity log. Persisted to
   localStorage (no backend — demo-grade auth, plain-text
   passwords in the browser only).
----------------------------------------------------------------- */

const STORAGE_KEY = "roomie-app-state-v2";
const MAX_ACTIVITY = 200;

const AVATAR_PALETTE = ["#D8A9A0", "#C9A46A", "#8A7F6B", "#B6C99B", "#9FB6C9", "#E0805A"];
export const NOTE_COLORS = ["gold", "lime", "ember"];

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function logEntry(roommate, category, action) {
  return { id: makeId("log"), day: "Today", time: nowTime(), roommate, category, action };
}

function capLog(log) {
  return log.slice(0, MAX_ACTIVITY);
}

const DEFAULT_SETTINGS = { currency: "USD", logReminders: true };

const emptyState = {
  users: {},
  currentUserId: null,
  bills: [],
  loans: [],
  notes: [],
  events: [],
  activityLog: [],
  attachments: [],
  settings: { ...DEFAULT_SETTINGS },
  ui: { settingsOpen: false },
};

function sanitizeSettings(saved) {
  const s = saved && typeof saved === "object" ? saved : {};
  return {
    currency: typeof s.currency === "string" && /^[A-Z]{3}$/.test(s.currency) ? s.currency : "USD",
    logReminders: s.logReminders !== false,
  };
}

function sanitizeUsers(saved) {
  const users = saved && typeof saved === "object" ? { ...saved } : {};
  for (const id of Object.keys(users)) {
    if (!users[id] || typeof users[id] !== "object") {
      delete users[id];
      continue;
    }
    users[id] = { ...users[id], isAdmin: users[id].isAdmin === true };
  }
  // Migration: households saved before roles existed get their
  // earliest-joined member (first key = insertion order) as admin.
  const ids = Object.keys(users);
  if (ids.length > 0 && !ids.some((id) => users[id].isAdmin)) {
    users[ids[0]] = { ...users[ids[0]], isAdmin: true };
  }
  return users;
}

function sanitizeState(saved) {
  if (!saved || typeof saved !== "object") return emptyState;
  return {
    users: sanitizeUsers(saved.users),
    currentUserId:
      typeof saved.currentUserId === "string" && saved.users?.[saved.currentUserId]
        ? saved.currentUserId
        : null,
    bills: Array.isArray(saved.bills) ? saved.bills.filter((b) => b && b.id && b.splits) : [],
    loans: Array.isArray(saved.loans) ? saved.loans.filter((l) => l && l.id) : [],
    notes: Array.isArray(saved.notes) ? saved.notes.filter((n) => n && n.id) : [],
    events: Array.isArray(saved.events) ? saved.events.filter((e) => e && e.id) : [],
    activityLog: Array.isArray(saved.activityLog) ? saved.activityLog.slice(0, MAX_ACTIVITY) : [],
    attachments: [],
    settings: sanitizeSettings(saved.settings),
    ui: { settingsOpen: false },
  };
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeState(JSON.parse(raw));
    // Drop legacy v1 seed (contained test users) if present.
    localStorage.removeItem("roomie-app-state-v1");
  } catch {
    // corrupt or unavailable storage — start empty
  }
  return emptyState;
}

function reducer(state, action) {
  switch (action.type) {
    case "SIGN_UP": {
      const { id, name, email, password } = action.payload;
      const bg = AVATAR_PALETTE[Object.keys(state.users).length % AVATAR_PALETTE.length];
      // The first account to join a fresh household becomes its admin.
      const user = { id, name, email, password, bg, isAdmin: Object.keys(state.users).length === 0 };
      return {
        ...state,
        users: { ...state.users, [id]: user },
        currentUserId: id,
        activityLog: capLog([logEntry(id, "account", `${name} joined the household`), ...state.activityLog]),
      };
    }
    case "SET_CURRENT_USER":
      return { ...state, currentUserId: action.payload.id };
    case "LOG_OUT":
      return { ...state, currentUserId: null };
    case "ADD_BILL": {
      const { name, category, amount, due, dueDate, recurrence, participants, actorId } = action.payload;
      const cleanParticipants = [...new Set(participants)].filter((id) => state.users[id]);
      if (!name.trim() || !(Number(amount) > 0) || cleanParticipants.length === 0) return state;
      const bill = {
        id: makeId("bill"),
        name: name.trim(),
        category,
        amount: Math.round(Number(amount) * 100) / 100,
        due: (due || "").trim() || "This month",
        dueDate: /^\d{4}-\d{2}-\d{2}$/.test(dueDate || "") ? dueDate : null,
        recurrence: ["Weekly", "Monthly"].includes(recurrence) ? recurrence : "None",
        splits: Object.fromEntries(cleanParticipants.map((id) => [id, false])),
      };
      return {
        ...state,
        bills: [...state.bills, bill],
        activityLog: capLog([logEntry(actorId, "bills", `added a new bill “${bill.name}” ($${bill.amount})`), ...state.activityLog]),
      };
    }
    case "DELETE_BILL": {
      const { id, actorId } = action.payload;
      const bill = state.bills.find((b) => b.id === id);
      if (!bill) return state;
      return {
        ...state,
        bills: state.bills.filter((b) => b.id !== id),
        activityLog: capLog([logEntry(actorId, "bills", `removed the bill “${bill.name}”`), ...state.activityLog]),
      };
    }
    case "TOGGLE_BILL_PAID": {
      const { billId, roommateId } = action.payload;
      const bill = state.bills.find((b) => b.id === billId);
      if (!bill || !(roommateId in bill.splits)) return state;
      const nextPaid = !bill.splits[roommateId];
      const bills = state.bills.map((b) => (b.id === billId ? { ...b, splits: { ...b.splits, [roommateId]: nextPaid } } : b));
      const count = Math.max(1, Object.keys(bill.splits).length);
      const share = (Number(bill.amount) / count).toFixed(2);
      const activityLog = nextPaid
        ? capLog([logEntry(roommateId, "bills", `paid their $${share} share of ${bill.name}`), ...state.activityLog])
        : state.activityLog;
      return { ...state, bills, activityLog };
    }
    case "UPDATE_BILL_SPLIT": {
      const { billId, participantIds, actorId } = action.payload;
      const bill = state.bills.find((b) => b.id === billId);
      if (!bill) return state;
      const clean = [...new Set(participantIds)].filter((id) => state.users[id]);
      if (clean.length === 0) return state;
      const splits = Object.fromEntries(clean.map((id) => [id, bill.splits[id] ?? false]));
      const bills = state.bills.map((b) => (b.id === billId ? { ...b, splits } : b));
      return { ...state, bills, activityLog: capLog([logEntry(actorId, "bills", `updated who's splitting ${bill.name}`), ...state.activityLog]) };
    }
    case "ADD_LOAN": {
      const { roommate, title, amount, direction, actorId } = action.payload;
      if (!state.users[roommate] || !title.trim() || !(Number(amount) > 0)) return state;
      const rounded = Math.round(Number(amount) * 100) / 100;
      const loan = { id: makeId("loan"), roommate, title: title.trim(), amount: rounded, direction, date: "Today", repayments: [], status: "pending", createdBy: actorId };
      const otherName = state.users[roommate]?.name ?? "roommate";
      const msg = direction === "owedToYou" ? `logged lending $${rounded} to ${otherName} for “${loan.title}” (awaiting confirmation)` : `requested $${rounded} from ${otherName} for “${loan.title}”`;
      return { ...state, loans: [...state.loans, loan], activityLog: capLog([logEntry(actorId, "lending", msg), ...state.activityLog]) };
    }
    case "UPDATE_LOAN": {
      const { id, title, amount, direction, roommate, actorId } = action.payload;
      const loan = state.loans.find((l) => l.id === id);
      if (!loan || !state.users[roommate] || !title.trim() || !(Number(amount) > 0)) return state;
      const repaid = loan.repayments.reduce((s, r) => s + Number(r.amount || 0), 0);
      if (Number(amount) < repaid) return state;
      const loans = state.loans.map((l) =>
        l.id === id ? { ...l, title: title.trim(), amount: Math.round(Number(amount) * 100) / 100, direction, roommate } : l
      );
      return { ...state, loans, activityLog: capLog([logEntry(actorId, "lending", `updated the loan “${title.trim()}”`), ...state.activityLog]) };
    }
    case "DELETE_LOAN": {
      const { id, actorId } = action.payload;
      const loan = state.loans.find((l) => l.id === id);
      if (!loan) return state;
      // Pending requests can only be cancelled by their creator;
      // confirmed loans are shared records any member may remove.
      if ((loan.status || "confirmed") === "pending" && loan.createdBy && loan.createdBy !== actorId) return state;
      return {
        ...state,
        loans: state.loans.filter((l) => l.id !== id),
        activityLog: capLog([logEntry(actorId, "lending", `removed the loan “${loan.title}”`), ...state.activityLog]),
      };
    }
    case "CONFIRM_LOAN": {
      const { id, actorId } = action.payload;
      const loan = state.loans.find((l) => l.id === id);
      if (!loan || (loan.status || "confirmed") !== "pending") return state;
      // Only the counterparty (not the creator) confirms.
      if (loan.createdBy && actorId !== loan.roommate) return state;
      const loans = state.loans.map((l) => (l.id === id ? { ...l, status: "confirmed" } : l));
      return { ...state, loans, activityLog: capLog([logEntry(actorId, "lending", `confirmed the “${loan.title}” loan`), ...state.activityLog]) };
    }
    case "DECLINE_LOAN": {
      const { id, actorId } = action.payload;
      const loan = state.loans.find((l) => l.id === id);
      if (!loan || (loan.status || "confirmed") !== "pending") return state;
      if (loan.createdBy && actorId !== loan.roommate) return state;
      const loans = state.loans.map((l) => (l.id === id ? { ...l, status: "declined" } : l));
      return { ...state, loans, activityLog: capLog([logEntry(actorId, "lending", `declined the “${loan.title}” loan`), ...state.activityLog]) };
    }
    case "ADD_REPAYMENT": {
      const { loanId, amount, actorId } = action.payload;
      const loan = state.loans.find((l) => l.id === loanId);
      if (!loan || !(Number(amount) > 0)) return state;
      if ((loan.status || "confirmed") !== "confirmed") return state;
      const repaid = loan.repayments.reduce((s, r) => s + Number(r.amount || 0), 0);
      const remaining = Number(loan.amount) - repaid;
      const clamped = Math.min(Number(amount), Math.max(0, Math.round(remaining * 100) / 100));
      if (!(clamped > 0)) return state;
      const rounded = Math.round(clamped * 100) / 100;
      const loans = state.loans.map((l) => (l.id === loanId ? { ...l, repayments: [...l.repayments, { date: "Today", amount: rounded }] } : l));
      const otherName = state.users[loan.roommate]?.name ?? "roommate";
      const actorName = state.users[actorId]?.name ?? "Someone";
      const msg = loan.direction === "owedToYou" ? `${otherName} repaid $${rounded} on the “${loan.title}” loan` : `${actorName} paid $${rounded} toward the “${loan.title}” loan`;
      const actor = loan.direction === "owedToYou" ? loan.roommate : actorId;
      return { ...state, loans, activityLog: capLog([logEntry(actor, "lending", msg), ...state.activityLog]) };
    }
    case "ADD_NOTE": {
      const { title, body, color, actorId } = action.payload;
      if (!title.trim() || !body.trim()) return state;
      const note = {
        id: makeId("note"),
        title: title.trim().slice(0, 80),
        body: body.trim().slice(0, 2000),
        author: actorId,
        time: "Just now",
        color: NOTE_COLORS.includes(color) ? color : "gold",
        pinned: false,
      };
      return { ...state, notes: [...state.notes, note], activityLog: capLog([logEntry(actorId, "notes", `added the note “${note.title}”`), ...state.activityLog]) };
    }
    case "UPDATE_NOTE": {
      const { id, title, body, color, actorId } = action.payload;
      if (!title.trim() || !body.trim()) return state;
      const notes = state.notes.map((n) =>
        n.id === id
          ? { ...n, title: title.trim().slice(0, 80), body: body.trim().slice(0, 2000), color: NOTE_COLORS.includes(color) ? color : n.color, time: "Just now" }
          : n
      );
      return { ...state, notes, activityLog: capLog([logEntry(actorId, "notes", `edited the note “${title.trim()}”`), ...state.activityLog]) };
    }
    case "TOGGLE_NOTE_PIN": {
      const { id, actorId } = action.payload;
      const note = state.notes.find((n) => n.id === id);
      if (!note) return state;
      const notes = state.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
      return { ...state, notes, activityLog: capLog([logEntry(actorId, "notes", `${note.pinned ? "unpinned" : "pinned"} the note “${note.title}”`), ...state.activityLog]) };
    }
    case "DELETE_NOTE": {
      const { id, actorId } = action.payload;
      const note = state.notes.find((n) => n.id === id);
      const notes = state.notes.filter((n) => n.id !== id);
      return { ...state, notes, activityLog: note ? capLog([logEntry(actorId, "notes", `deleted the note “${note.title}”`), ...state.activityLog]) : state.activityLog };
    }
    case "ADD_EVENT": {
      const { title, day, time, color, people, actorId } = action.payload;
      const cleanPeople = [...new Set(people)].filter((id) => state.users[id]);
      if (!title.trim() || !time.trim() || cleanPeople.length === 0 || !(Number(day) >= 1 && Number(day) <= 31)) return state;
      const event = { id: makeId("event"), title: title.trim().slice(0, 80), day: Number(day), time: time.trim().slice(0, 40), color, people: cleanPeople };
      return { ...state, events: [...state.events, event], activityLog: capLog([logEntry(actorId, "calendar", `created the event “${event.title}”`), ...state.activityLog]) };
    }
    case "UPDATE_EVENT": {
      const { id, title, day, time, color, people, actorId } = action.payload;
      const cleanPeople = [...new Set(people)].filter((pid) => state.users[pid]);
      if (!title.trim() || !time.trim() || cleanPeople.length === 0 || !(Number(day) >= 1 && Number(day) <= 31)) return state;
      const events = state.events.map((e) =>
        e.id === id ? { ...e, title: title.trim().slice(0, 80), day: Number(day), time: time.trim().slice(0, 40), color, people: cleanPeople } : e
      );
      return { ...state, events, activityLog: capLog([logEntry(actorId, "calendar", `updated the event “${title.trim()}”`), ...state.activityLog]) };
    }
    case "DELETE_EVENT": {
      const { id, actorId } = action.payload;
      const event = state.events.find((e) => e.id === id);
      const events = state.events.filter((e) => e.id !== id);
      return { ...state, events, activityLog: event ? capLog([logEntry(actorId, "calendar", `removed the event “${event.title}”`), ...state.activityLog]) : state.activityLog };
    }
    case "LOG_ACTIVITY": {
      const { roommate, category, action: text } = action.payload;
      if (!text.trim() || !state.users[roommate]) return state;
      return { ...state, activityLog: capLog([logEntry(roommate, category, text.trim().slice(0, 120)), ...state.activityLog]) };
    }
    case "UPDATE_SETTINGS": {
      const patch = action.payload || {};
      const settings = { ...state.settings };
      if (typeof patch.currency === "string" && /^[A-Z]{3}$/.test(patch.currency)) settings.currency = patch.currency;
      if (typeof patch.logReminders === "boolean") settings.logReminders = patch.logReminders;
      return { ...state, settings };
    }
    case "CLEAR_ACTIVITY":
      return { ...state, activityLog: [] };
    case "REMOVE_MEMBER": {
      const { id, actorId } = action.payload;
      const actor = state.users[actorId];
      const target = state.users[id];
      if (!actor?.isAdmin || !target || id === actorId) return state;
      const users = { ...state.users };
      delete users[id];
      const bills = state.bills.map((b) => {
        if (!b.splits || !(id in b.splits)) return b;
        const splits = { ...b.splits };
        delete splits[id];
        return { ...b, splits };
      });
      const events = state.events.map((e) => ({
        ...e,
        people: (e.people || []).filter((pid) => pid !== id),
      }));
      return {
        ...state,
        users,
        bills,
        events,
        activityLog: capLog([logEntry(actorId, "account", `removed ${target.name} from the household`), ...state.activityLog]),
      };
    }
    case "RESET_DATA":
      return { ...state, bills: [], loans: [], notes: [], events: [], activityLog: [] };
    case "OPEN_SETTINGS":
      return { ...state, ui: { ...state.ui, settingsOpen: true } };
    case "CLOSE_SETTINGS":
      return { ...state, ui: { ...state.ui, settingsOpen: false } };
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      const { ui, ...persisted } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // storage unavailable — fail silently
    }
  }, [state]);

  function signUp({ name, email, password }) {
    const cleanName = (name || "").trim();
    const normalized = (email || "").trim().toLowerCase();
    if (!cleanName) return { ok: false, error: "Please enter your name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { ok: false, error: "Please enter a valid email address." };
    if ((password || "").length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    const exists = Object.values(state.users).some((u) => u.email.toLowerCase() === normalized);
    if (exists) return { ok: false, error: "An account with that email already exists." };
    const id = makeId("u").replace(/[^a-z0-9-]/gi, "");
    dispatch({ type: "SIGN_UP", payload: { id, name: cleanName.slice(0, 40), email: normalized, password } });
    return { ok: true };
  }

  function logIn({ email, password }) {
    const normalized = (email || "").trim().toLowerCase();
    const found = Object.values(state.users).find((u) => u.email.toLowerCase() === normalized && u.password === password);
    if (!found) return { ok: false, error: "That email and password don't match any account." };
    dispatch({ type: "SET_CURRENT_USER", payload: { id: found.id } });
    return { ok: true };
  }

  const actions = {
    signUp,
    logIn,
    logOut: () => dispatch({ type: "LOG_OUT" }),
    addBill: (payload) => dispatch({ type: "ADD_BILL", payload }),
    deleteBill: (id, actorId) => dispatch({ type: "DELETE_BILL", payload: { id, actorId } }),
    toggleBillPaid: (billId, roommateId) => dispatch({ type: "TOGGLE_BILL_PAID", payload: { billId, roommateId } }),
    updateBillSplit: (billId, participantIds, actorId) => dispatch({ type: "UPDATE_BILL_SPLIT", payload: { billId, participantIds, actorId } }),
    addLoan: (payload) => dispatch({ type: "ADD_LOAN", payload }),
    updateLoan: (payload) => dispatch({ type: "UPDATE_LOAN", payload }),
    deleteLoan: (id, actorId) => dispatch({ type: "DELETE_LOAN", payload: { id, actorId } }),
    confirmLoan: (id, actorId) => dispatch({ type: "CONFIRM_LOAN", payload: { id, actorId } }),
    declineLoan: (id, actorId) => dispatch({ type: "DECLINE_LOAN", payload: { id, actorId } }),
    addRepayment: (loanId, amount, actorId) => dispatch({ type: "ADD_REPAYMENT", payload: { loanId, amount, actorId } }),
    addNote: (payload) => dispatch({ type: "ADD_NOTE", payload }),
    updateNote: (payload) => dispatch({ type: "UPDATE_NOTE", payload }),
    toggleNotePin: (id, actorId) => dispatch({ type: "TOGGLE_NOTE_PIN", payload: { id, actorId } }),
    deleteNote: (id, actorId) => dispatch({ type: "DELETE_NOTE", payload: { id, actorId } }),
    addEvent: (payload) => dispatch({ type: "ADD_EVENT", payload }),
    updateEvent: (payload) => dispatch({ type: "UPDATE_EVENT", payload }),
    deleteEvent: (id, actorId) => dispatch({ type: "DELETE_EVENT", payload: { id, actorId } }),
    logActivity: (payload) => dispatch({ type: "LOG_ACTIVITY", payload }),
    updateSettings: (patch) => dispatch({ type: "UPDATE_SETTINGS", payload: patch }),
    clearActivity: () => dispatch({ type: "CLEAR_ACTIVITY" }),
    removeMember: (id, actorId) => dispatch({ type: "REMOVE_MEMBER", payload: { id, actorId } }),
    resetData: () => dispatch({ type: "RESET_DATA" }),
    addAttachment: async () => ({ ok: false, error: "Attachments need online mode — connect Supabase in Settings." }),
    deleteAttachment: () => {},
    getAttachmentUrl: async () => null,
    openSettings: () => dispatch({ type: "OPEN_SETTINGS" }),
    closeSettings: () => dispatch({ type: "CLOSE_SETTINGS" }),
  };

  const currentUser = state.currentUserId ? state.users[state.currentUserId] : null;

  return <AppStateContext.Provider value={{ state, actions, currentUser, needsHousehold: false }}>{children}</AppStateContext.Provider>;
}

export { useAppState };
