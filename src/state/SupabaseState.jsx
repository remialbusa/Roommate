import { useCallback, useEffect, useRef, useState } from "react";
import AppStateContext from "./appContext";
import { getSupabase, makeInviteCode, nowTime } from "../lib/supabase";

const AVATAR_PALETTE = ["#D8A9A0", "#C9A46A", "#8A7F6B", "#B6C99B", "#9FB6C9", "#E0805A"];
const NOTE_COLORS = ["gold", "lime", "ember"];
const MAX_ACTIVITY = 200;

function pickBg(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function errMsg(error, fallback) {
  return error?.message || fallback;
}

export function SupabaseStateProvider({ children }) {
  const supabase = getSupabase();
  const [sessionUser, setSessionUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]); // [{user_id, role, profile:{name,bg}}]
  const [bills, setBills] = useState([]);
  const [loans, setLoans] = useState([]);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reloadTimer = useRef(null);
  const idsRef = useRef({ userId: null, householdId: null });
  idsRef.current = { userId: sessionUser?.id ?? null, householdId: household?.id ?? null };

  const loadData = useCallback(async () => {
    const { userId, householdId } = idsRef.current;
    if (!supabase || !userId || !householdId) return;
    try {
      const [membersRes, billsRes, splitsRes, loansRes, repayRes, notesRes, eventsRes, attendRes, activityRes] =
        await Promise.all([
          supabase.from("memberships").select("role,user_id,joined_at,profiles!inner(id,name,bg)").eq("household_id", householdId).order("joined_at"),
          supabase.from("bills").select("*").eq("household_id", householdId).order("created_at"),
          supabase.from("bill_splits").select("bill_id,user_id,paid"),
          supabase.from("loans").select("*").eq("household_id", householdId).order("created_at"),
          supabase.from("repayments").select("loan_id,amount,date").order("created_at"),
          supabase.from("notes").select("*").eq("household_id", householdId).order("created_at"),
          supabase.from("events").select("*").eq("household_id", householdId).order("day"),
          supabase.from("event_attendees").select("event_id,user_id"),
          supabase.from("activity_log").select("*").eq("household_id", householdId).order("created_at", { ascending: false }).limit(MAX_ACTIVITY),
        ]);
      if (membersRes.data) setMembers(membersRes.data);
      if (billsRes.data) {
        const byBill = {};
        for (const s of splitsRes.data || []) {
          if (!byBill[s.bill_id]) byBill[s.bill_id] = {};
          byBill[s.bill_id][s.user_id] = s.paid;
        }
        // Only keep splits for bills in this household (RLS already scopes, belt and suspenders).
        const mine = new Set(billsRes.data.map((b) => b.id));
        const filtered = {};
        for (const [bid, splits] of Object.entries(byBill)) if (mine.has(bid)) filtered[bid] = splits;
        setBills(
          billsRes.data.map((b) => ({
            id: b.id,
            name: b.name,
            category: b.category,
            amount: Number(b.amount),
            due: b.due,
            splits: filtered[b.id] || {},
          }))
        );
      }
      if (loansRes.data) {
        const byLoan = {};
        for (const r of repayRes.data || []) {
          if (!byLoan[r.loan_id]) byLoan[r.loan_id] = [];
          byLoan[r.loan_id].push({ date: r.date, amount: Number(r.amount) });
        }
        const mine = new Set(loansRes.data.map((l) => l.id));
        const filtered = {};
        for (const [lid, rows] of Object.entries(byLoan)) if (mine.has(lid)) filtered[lid] = rows;
        setLoans(
          loansRes.data.map((l) => {
            // Shape loans from the viewer's perspective so every screen
            // works unchanged: roommate = the other party, direction
            // flipped when the viewer is the counterparty.
            let roommate = l.counterparty_id;
            let direction = l.direction;
            if (userId && l.counterparty_id === userId) {
              roommate = l.created_by;
              direction = l.direction === "owedToYou" ? "youOwe" : "owedToYou";
            }
            return {
              id: l.id,
              roommate,
              title: l.title,
              amount: Number(l.amount),
              date: l.date,
              direction,
              repayments: filtered[l.id] || [],
            };
          })
        );
      }
      if (notesRes.data) {
        setNotes(
          notesRes.data.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            author: n.author,
            time: n.time,
            color: n.color,
            pinned: n.pinned,
          }))
        );
      }
      if (eventsRes.data) {
        const byEvent = {};
        for (const a of attendRes.data || []) {
          if (!byEvent[a.event_id]) byEvent[a.event_id] = [];
          byEvent[a.event_id].push(a.user_id);
        }
        setEvents(
          eventsRes.data.map((e) => ({
            id: e.id,
            day: e.day,
            title: e.title,
            time: e.time,
            color: e.color,
            people: byEvent[e.id] || [],
          }))
        );
      }
      if (activityRes.data) {
        setActivityLog(
          activityRes.data.map((e) => ({
            id: e.id,
            day: e.day,
            time: e.time,
            roommate: e.roommate,
            category: e.category,
            action: e.action,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to load household data:", e);
    }
  }, [supabase]);

  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(loadData, 400);
  }, [loadData]);

  const loadHousehold = useCallback(
    async (userId) => {
      if (!supabase || !userId) {
        setHousehold(null);
        return null;
      }
      const { data, error } = await supabase
        .from("memberships")
        .select("role,household_id,joined_at,households!inner(id,name,invite_code,currency,log_reminders)")
        .eq("user_id", userId)
        .order("joined_at")
        .limit(1)
        .maybeSingle();
      if (error || !data) {
        setHousehold(null);
        return null;
      }
      const h = {
        id: data.households.id,
        name: data.households.name,
        invite_code: data.households.invite_code,
        currency: data.households.currency,
        log_reminders: data.households.log_reminders,
      };
      setHousehold(h);
      return h;
    },
    [supabase]
  );

  // Auth session tracking.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessionUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Load household whenever the session user changes; clear on logout.
  useEffect(() => {
    if (!sessionUser) {
      setHousehold(null);
      setMembers([]);
      setBills([]);
      setLoans([]);
      setNotes([]);
      setEvents([]);
      setActivityLog([]);
      return;
    }
    loadHousehold(sessionUser.id).then(() => loadData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id]);

  // Load data once the household is known; subscribe to realtime.
  useEffect(() => {
    if (!supabase || !sessionUser || !household) return;
    loadData();
    const channel = supabase
      .channel(`household:${household.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "bill_splits" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "loans" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "repayments" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_attendees" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "memberships" }, () => {
        if (idsRef.current.userId) {
          loadHousehold(idsRef.current.userId).then(() => loadData());
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "households" }, () => {
        if (idsRef.current.userId) loadHousehold(idsRef.current.userId);
      })
      .subscribe();
    return () => {
      clearTimeout(reloadTimer.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, sessionUser?.id, household?.id]);

  async function ensureProfile(userId, name) {
    const { data } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!data) {
      await supabase.from("profiles").insert({ id: userId, name: (name || "Roommate").slice(0, 40), bg: pickBg(userId) });
    } else if (name) {
      await supabase.from("profiles").update({ name: name.slice(0, 40) }).eq("id", userId);
    }
  }

  async function logRow(roommateId, category, action) {
    const { householdId } = idsRef.current;
    if (!householdId || !roommateId) return;
    await supabase.from("activity_log").insert({
      household_id: householdId,
      day: "Today",
      time: nowTime(),
      roommate: roommateId,
      category,
      action: String(action).slice(0, 120),
    });
  }

  // ---------- Auth ----------

  async function signUp({ name, email, password }) {
    const cleanName = (name || "").trim();
    const normalized = (email || "").trim().toLowerCase();
    if (!cleanName) return { ok: false, error: "Please enter your name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { ok: false, error: "Please enter a valid email address." };
    if ((password || "").length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    const { data, error } = await supabase.auth.signUp({ email: normalized, password });
    if (error) return { ok: false, error: errMsg(error, "Could not create your account.") };
    if (!data.session || !data.user) {
      return { ok: false, error: "Check your email to confirm your account, then log in." };
    }
    await ensureProfile(data.user.id, cleanName);
    return { ok: true };
  }

  async function logIn({ email, password }) {
    const normalized = (email || "").trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) return { ok: false, error: "That email and password don't match any account." };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await ensureProfile(user.id);
    return { ok: true };
  }

  async function logOut() {
    await supabase.auth.signOut();
  }

  async function createHousehold(householdName) {
    const user = (await supabase.auth.getUser()).data.user;
    const clean = (householdName || "").trim().slice(0, 40) || "My Household";
    if (!user) return { ok: false, error: "You need to be logged in." };
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("households")
        .insert({ name: clean, invite_code: makeInviteCode() })
        .select("id,name,invite_code,currency,log_reminders")
        .single();
      if (!error && data) {
        await supabase.from("memberships").insert({ household_id: data.id, user_id: user.id, role: "admin" });
        setHousehold(data);
        await logRow(user.id, "account", `created the “${clean}” household`);
        await loadData();
        return { ok: true };
      }
      if (error && error.code !== "23505") return { ok: false, error: errMsg(error, "Could not create the household.") };
    }
    return { ok: false, error: "Could not generate a household code — try again." };
  }

  async function joinHousehold(code) {
    const user = (await supabase.auth.getUser()).data.user;
    const clean = (code || "").trim().toUpperCase();
    if (!user) return { ok: false, error: "You need to be logged in." };
    if (!clean) return { ok: false, error: "Please enter an invite code." };
    const { data: found, error } = await supabase.from("households").select("id,name").eq("invite_code", clean).maybeSingle();
    if (error || !found) return { ok: false, error: "No household found for that code." };
    const { error: joinError } = await supabase.from("memberships").insert({ household_id: found.id, user_id: user.id, role: "member" });
    if (joinError && joinError.code !== "23505") return { ok: false, error: errMsg(joinError, "Could not join the household.") };
    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const h = await loadHousehold(user.id);
    if (h) {
      await loadData();
      await logRow(user.id, "account", `${profile?.name ?? "Someone"} joined the household`);
    }
    return { ok: true };
  }

  // ---------- Data (same signatures as the local provider) ----------

  function householdId() {
    return idsRef.current.householdId;
  }
  function userId() {
    return idsRef.current.userId;
  }

  const actions = {
    signUp,
    logIn,
    logOut,
    createHousehold,
    joinHousehold,
    addBill: async ({ name, category, amount, due, participants }) => {
      try {
        const hid = householdId();
        const clean = [...new Set(participants || [])];
        if (!hid || !name.trim() || !(Number(amount) > 0) || clean.length === 0) return;
        const { data, error } = await supabase
          .from("bills")
          .insert({
            household_id: hid,
            name: name.trim(),
            category,
            amount: Math.round(Number(amount) * 100) / 100,
            due: (due || "").trim() || "This month",
            created_by: userId(),
          })
          .select("id,name,amount")
          .single();
        if (error || !data) return;
        await supabase.from("bill_splits").insert(clean.map((uid) => ({ bill_id: data.id, user_id: uid, paid: false })));
        await logRow(userId(), "bills", `added a new bill “${data.name}” ($${data.amount})`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    deleteBill: async (id) => {
      try {
        const bill = bills.find((b) => b.id === id);
        await supabase.from("bills").delete().eq("id", id);
        if (bill) await logRow(userId(), "bills", `removed the bill “${bill.name}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    toggleBillPaid: async (billId, roommateId) => {
      try {
        const bill = bills.find((b) => b.id === billId);
        if (!bill || !(roommateId in (bill.splits || {}))) return;
        const nextPaid = !bill.splits[roommateId];
        await supabase.from("bill_splits").update({ paid: nextPaid }).eq("bill_id", billId).eq("user_id", roommateId);
        if (nextPaid) {
          const count = Math.max(1, Object.keys(bill.splits).length);
          const share = (Number(bill.amount) / count).toFixed(2);
          await logRow(roommateId, "bills", `paid their $${share} share of ${bill.name}`);
        }
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    updateBillSplit: async (billId, participantIds) => {
      try {
        const bill = bills.find((b) => b.id === billId);
        if (!bill) return;
        const clean = [...new Set(participantIds || [])];
        if (clean.length === 0) return;
        const prev = bill.splits || {};
        await supabase.from("bill_splits").delete().eq("bill_id", billId);
        await supabase.from("bill_splits").insert(clean.map((uid) => ({ bill_id: billId, user_id: uid, paid: prev[uid] ?? false })));
        await logRow(userId(), "bills", `updated who's splitting ${bill.name}`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    addLoan: async ({ roommate, title, amount, direction }) => {
      try {
        const hid = householdId();
        if (!hid || !title.trim() || !(Number(amount) > 0)) return;
        const rounded = Math.round(Number(amount) * 100) / 100;
        const me = stateView().users[roommate];
        const otherName = me?.name ?? "roommate";
        const { error } = await supabase.from("loans").insert({
          household_id: hid,
          title: title.trim(),
          amount: rounded,
          direction,
          counterparty_id: roommate || null,
          counterparty_name: otherName,
          date: "Today",
          created_by: userId(),
        });
        if (error) return;
        const msg = direction === "owedToYou" ? `lent $${rounded} to ${otherName} for “${title.trim()}”` : `borrowed $${rounded} from ${otherName} for “${title.trim()}”`;
        await logRow(userId(), "lending", msg);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    updateLoan: async ({ id, title, amount, direction, roommate }) => {
      try {
        if (!title.trim() || !(Number(amount) > 0)) return;
        const me = stateView().users[roommate];
        await supabase
          .from("loans")
          .update({
            title: title.trim(),
            amount: Math.round(Number(amount) * 100) / 100,
            direction,
            counterparty_id: roommate || null,
            counterparty_name: me?.name ?? "roommate",
          })
          .eq("id", id);
        await logRow(userId(), "lending", `updated the loan “${title.trim()}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    deleteLoan: async (id) => {
      try {
        const loan = loans.find((l) => l.id === id);
        await supabase.from("loans").delete().eq("id", id);
        if (loan) await logRow(userId(), "lending", `removed the loan “${loan.title}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    addRepayment: async (loanId, amount) => {
      try {
        const loan = loans.find((l) => l.id === loanId);
        if (!loan || !(Number(amount) > 0)) return;
        const repaid = (loan.repayments || []).reduce((s, r) => s + Number(r.amount || 0), 0);
        const remaining = Number(loan.amount) - repaid;
        const clamped = Math.min(Number(amount), Math.max(0, Math.round(remaining * 100) / 100));
        if (!(clamped > 0)) return;
        const rounded = Math.round(clamped * 100) / 100;
        // Counterparty identity in stored terms (unflip the viewer mapping).
        const stored = await supabase.from("loans").select("direction,counterparty_id,title").eq("id", loanId).maybeSingle();
        await supabase.from("repayments").insert({ loan_id: loanId, amount: rounded, date: "Today", created_by: userId() });
        if (stored.data) {
          const title = stored.data.title;
          // Attribute like the local version: counterparty-side for owedToYou.
          const viewerIsCounterparty = stored.data.counterparty_id === userId();
          const actorName = stateView().users[userId()]?.name ?? "Someone";
          const otherName = stateView().users[stored.data.counterparty_id]?.name ?? "roommate";
          const msg =
            stored.data.direction === "owedToYou"
              ? `${viewerIsCounterparty ? actorName : otherName} repaid $${rounded} on the “${title}” loan`
              : `${actorName} paid $${rounded} toward the “${title}” loan`;
          const actor = stored.data.direction === "owedToYou" && !viewerIsCounterparty ? stored.data.counterparty_id : userId();
          await logRow(actor, "lending", msg);
        }
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    addNote: async ({ title, body, color }) => {
      try {
        const hid = householdId();
        if (!hid || !title.trim() || !body.trim()) return;
        const { error } = await supabase.from("notes").insert({
          household_id: hid,
          title: title.trim().slice(0, 80),
          body: body.trim().slice(0, 2000),
          author: userId(),
          time: "Just now",
          color: NOTE_COLORS.includes(color) ? color : "gold",
          pinned: false,
        });
        if (error) return;
        await logRow(userId(), "notes", `added the note “${title.trim()}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    updateNote: async ({ id, title, body, color }) => {
      try {
        if (!title.trim() || !body.trim()) return;
        const current = notes.find((n) => n.id === id);
        await supabase
          .from("notes")
          .update({
            title: title.trim().slice(0, 80),
            body: body.trim().slice(0, 2000),
            color: NOTE_COLORS.includes(color) ? color : current?.color || "gold",
            time: "Just now",
          })
          .eq("id", id);
        await logRow(userId(), "notes", `edited the note “${title.trim()}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    toggleNotePin: async (id) => {
      try {
        const note = notes.find((n) => n.id === id);
        if (!note) return;
        await supabase.from("notes").update({ pinned: !note.pinned }).eq("id", id);
        await logRow(userId(), "notes", `${note.pinned ? "unpinned" : "pinned"} the note “${note.title}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    deleteNote: async (id) => {
      try {
        const note = notes.find((n) => n.id === id);
        await supabase.from("notes").delete().eq("id", id);
        if (note) await logRow(userId(), "notes", `deleted the note “${note.title}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    addEvent: async ({ title, day, time, color, people }) => {
      try {
        const hid = householdId();
        const clean = [...new Set(people || [])];
        if (!hid || !title.trim() || !time.trim() || clean.length === 0 || !(Number(day) >= 1 && Number(day) <= 31)) return;
        const { data, error } = await supabase
          .from("events")
          .insert({ household_id: hid, title: title.trim().slice(0, 80), day: Number(day), time: time.trim().slice(0, 40), color })
          .select("id,title")
          .single();
        if (error || !data) return;
        await supabase.from("event_attendees").insert(clean.map((uid) => ({ event_id: data.id, user_id: uid })));
        await logRow(userId(), "calendar", `created the event “${data.title}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    updateEvent: async ({ id, title, day, time, color, people }) => {
      try {
        const clean = [...new Set(people || [])];
        if (!title.trim() || !time.trim() || clean.length === 0 || !(Number(day) >= 1 && Number(day) <= 31)) return;
        await supabase
          .from("events")
          .update({ title: title.trim().slice(0, 80), day: Number(day), time: time.trim().slice(0, 40), color })
          .eq("id", id);
        await supabase.from("event_attendees").delete().eq("event_id", id);
        await supabase.from("event_attendees").insert(clean.map((uid) => ({ event_id: id, user_id: uid })));
        await logRow(userId(), "calendar", `updated the event “${title.trim()}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    deleteEvent: async (id) => {
      try {
        const event = events.find((e) => e.id === id);
        await supabase.from("events").delete().eq("id", id);
        if (event) await logRow(userId(), "calendar", `removed the event “${event.title}”`);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    logActivity: async ({ roommate, category, action }) => {
      try {
        if (!String(action || "").trim()) return;
        await logRow(roommate, category, action);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    updateSettings: async (patch) => {
      try {
        const hid = householdId();
        if (!hid || !isAdminView()) return;
        const next = {};
        if (typeof patch?.currency === "string" && /^[A-Z]{3}$/.test(patch.currency)) next.currency = patch.currency;
        if (typeof patch?.logReminders === "boolean") next.log_reminders = patch.logReminders;
        if (Object.keys(next).length === 0) return;
        await supabase.from("households").update(next).eq("id", hid);
        await loadHousehold(userId());
      } catch (e) {
        console.error(e);
      }
    },
    clearActivity: async () => {
      try {
        const hid = householdId();
        if (!hid || !isAdminView()) return;
        await supabase.from("activity_log").delete().eq("household_id", hid);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    removeMember: async (id) => {
      try {
        const hid = householdId();
        const me = userId();
        if (!hid || !me || !isAdminView() || id === me) return;
        // Scrub per-bill splits and event attendees for the removed member.
        // (Their loans/notes/history stay visible as "Unknown", like local mode.)
        const billIds = bills.filter((b) => b.splits && id in b.splits).map((b) => b.id);
        for (const bid of billIds) {
          await supabase.from("bill_splits").delete().eq("bill_id", bid).eq("user_id", id);
        }
        const eventIds = events.filter((e) => (e.people || []).includes(id)).map((e) => e.id);
        for (const eid of eventIds) {
          await supabase.from("event_attendees").delete().eq("event_id", eid).eq("user_id", id);
        }
        const target = stateView().users[id];
        await supabase.from("memberships").delete().eq("household_id", hid).eq("user_id", id);
        await logRow(me, "account", `removed ${target?.name ?? "a member"} from the household`);
        await loadHousehold(me);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    resetData: async () => {
      try {
        const hid = householdId();
        if (!hid || !isAdminView()) return;
        // Child rows (splits, repayments, attendees) cascade automatically.
        for (const table of ["activity_log", "bills", "loans", "notes", "events"]) {
          await supabase.from(table).delete().eq("household_id", hid);
        }
        await loadData();
      } catch (e) {
        console.error(e);
      }
    },
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
  };

  // Local view helpers used by a few actions above.
  function stateView() {
    const users = {};
    for (const m of members) {
      users[m.user_id] = {
        id: m.user_id,
        name: m.profiles?.name ?? "Unknown",
        bg: m.profiles?.bg ?? "#8A7F6B",
        email: m.user_id === idsRef.current.userId ? sessionUser?.email ?? "" : "",
        isAdmin: m.role === "admin",
      };
    }
    return { users };
  }

  function isAdminView() {
    return members.some((m) => m.user_id === idsRef.current.userId && m.role === "admin");
  }

  // ---------- Shared-shape state ----------

  const users = {};
  for (const m of members) {
    users[m.user_id] = {
      id: m.user_id,
      name: m.profiles?.name ?? "Unknown",
      bg: m.profiles?.bg ?? "#8A7F6B",
      email: m.user_id === sessionUser?.id ? sessionUser?.email ?? "" : "",
      isAdmin: m.role === "admin",
    };
  }
  const currentUserId = sessionUser && members.some((m) => m.user_id === sessionUser.id) ? sessionUser.id : null;
  const currentUser = currentUserId ? users[currentUserId] : null;

  const state = {
    users,
    currentUserId,
    bills,
    loans,
    notes,
    events,
    activityLog,
    settings: {
      currency: household?.currency || "USD",
      logReminders: household?.log_reminders !== false,
    },
    household: household ? { id: household.id, name: household.name, invite_code: household.invite_code } : null,
    authReady,
    ui: { settingsOpen },
  };

  return (
    <AppStateContext.Provider value={{ state, actions, currentUser, needsHousehold: Boolean(sessionUser && authReady && !household) }}>
      {children}
    </AppStateContext.Provider>
  );
}
