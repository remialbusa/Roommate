/* Online connectivity probe: exercises auth, schema, RLS and realtime
 * against the Supabase project in .env.local, then cleans up its data.
 * Leaves behind ONE test auth user (delete it in the Dashboard if you
 * like: Authentication → Users). Run with: node scripts/online-check.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv(new URL("../.env.local", import.meta.url));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

const tag = Date.now().toString(36);
const email = `roomie-probe-${tag}@example.com`;
const password = `Probe-${tag}-x9`;
let userId = null;
let householdId = null;
let fatal = null;

try {
  // 1. Sign up (proves Auth + anon key work; needs Confirm-email OFF).
  const { data: signData, error: signError } = await supabase.auth.signUp({ email, password });
  if (signError) throw new Error("signUp: " + signError.message);
  if (!signData.session || !signData.user) {
    console.log("  [FAIL] session — sign-up returned no session. Turn OFF 'Confirm email' in Supabase Auth settings, then re-run.");
    process.exit(2);
  }
  userId = signData.user.id;
  check("auth.signUp returns a session", true);

  // 2. Profile (proves profiles RLS insert/select).
  const { error: profError } = await supabase.from("profiles").insert({ id: userId, name: "Probe", bg: "#8A7F6B" });
  check("profiles insert (own row)", !profError, profError?.message);
  const { data: profRow, error: profReadError } = await supabase.from("profiles").select("name").eq("id", userId).maybeSingle();
  check("profiles read", !profReadError && profRow?.name === "Probe", profReadError?.message);

  // 3. Household + admin membership.
  const { data: hh, error: hhError } = await supabase
    .from("households")
    .insert({ name: "Probe House", invite_code: "PRB" + tag.slice(-3).toUpperCase() })
    .select("id")
    .single();
  check("households insert", !hhError, hhError?.message);
  householdId = hh.id;
  const { error: memError } = await supabase.from("memberships").insert({ household_id: hh.id, user_id: userId, role: "admin" });
  check("memberships insert (self join as admin)", !memError, memError?.message);

  // 4. Bill + splits.
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({ household_id: hh.id, name: "Probe Bill", category: "Utilities", amount: 42.5, due: "Today", created_by: userId })
    .select("id")
    .single();
  check("bills insert", !billError, billError?.message);
  const { error: splitError } = await supabase.from("bill_splits").insert({ bill_id: bill.id, user_id: userId, paid: false });
  check("bill_splits insert", !splitError, splitError?.message);
  const { error: toggleError } = await supabase.from("bill_splits").update({ paid: true }).eq("bill_id", bill.id).eq("user_id", userId);
  check("bill_splits update (toggle paid)", !toggleError, toggleError?.message);

  // 5. Loan + repayment.
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .insert({ household_id: hh.id, title: "Probe Loan", amount: 25, direction: "owedToYou", counterparty_name: "Probe", date: "Today", created_by: userId })
    .select("id")
    .single();
  check("loans insert", !loanError, loanError?.message);
  const { error: repayError } = await supabase.from("repayments").insert({ loan_id: loan.id, amount: 25, date: "Today", created_by: userId });
  check("repayments insert", !repayError, repayError?.message);

  // 6. Note, event + attendee, activity.
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .insert({ household_id: hh.id, title: "Probe Note", body: "hello", author: userId, time: "Just now", color: "gold", pinned: false })
    .select("id")
    .single();
  check("notes insert", !noteError, noteError?.message);
  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({ household_id: hh.id, title: "Probe Event", day: 15, time: "7 PM", color: "lime" })
    .select("id")
    .single();
  check("events insert", !eventError, eventError?.message);
  const { error: attError } = await supabase.from("event_attendees").insert({ event_id: event.id, user_id: userId });
  check("event_attendees insert", !attError, attError?.message);
  const { error: actError } = await supabase
    .from("activity_log")
    .insert({ household_id: hh.id, day: "Today", time: "now", roommate: userId, category: "notes", action: "probe" });
  check("activity_log insert", !actError, actError?.message);

  // 7. Read-back across the household.
  const { data: billsBack, error: billsBackError } = await supabase.from("bills").select("id").eq("household_id", hh.id);
  check("household read-back", !billsBackError && billsBack.length === 1, billsBackError?.message);

  // 8. Realtime echo (proves the publication + websocket path).
  let pingError = null;
  let pingRowFound = false;
  const realtimeOk = await new Promise((resolve) => {
    const ch = supabase.channel("probe-" + tag);
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("activity_log").select("id").eq("household_id", hh.id).eq("action", "realtime ping").limit(1);
      pingRowFound = (data || []).length > 0;
      supabase.removeChannel(ch);
      resolve(false);
    }, 20000);
    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => {
      clearTimeout(timer);
      supabase.removeChannel(ch);
      resolve(true);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const { error } = await supabase.from("activity_log").insert({ household_id: hh.id, day: "Today", time: "now", roommate: userId, category: "notes", action: "realtime ping" });
        pingError = error?.message || null;
      }
    });
  });
  check("realtime INSERT echo", realtimeOk, realtimeOk ? "" : `ping insert error=${pingError || "none"}, ping row in table=${pingRowFound}`);
} catch (e) {
  fatal = e.message;
  console.log("  [FAIL] unexpected: " + (e.stack || e.message));
} finally {
  // 9. Cleanup: deleting the household cascades all test data.
  if (householdId) {
    const { error } = await supabase.from("households").delete().eq("id", householdId);
    check("cleanup (household delete cascades)", !error, error?.message);
  }
  await supabase.auth.signOut();
}

const failed = results.filter((r) => !r.ok);
if (fatal || failed.length) {
  console.log(`\n${failed.length + (fatal ? 1 : 0)} CHECK(S) FAILED`);
  await new Promise((r) => setTimeout(r, 300));
  process.exit(1);
}
console.log("\nALL ONLINE CHECKS PASSED");
console.log("Note: one test auth user remains — remove it in Supabase Dashboard → Authentication → Users if you like.");
await new Promise((r) => setTimeout(r, 300));
process.exit(0);
