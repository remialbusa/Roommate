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

  // 4b. Migration-002 surface: dated/recurring bill, pending loan status.
  const { data: bill2, error: bill2Error } = await supabase
    .from("bills")
    .insert({ household_id: hh.id, name: "Probe Dated", category: "Rent", amount: 100, due: "Today", due_date: "2026-10-01", recurrence: "Monthly", created_by: userId })
    .select("id,due_date,recurrence")
    .single();
  check("bills due_date+recurrence (migration-002)", !bill2Error && bill2?.due_date === "2026-10-01" && bill2?.recurrence === "Monthly", bill2Error?.message);
  const { data: loan2, error: loan2Error } = await supabase
    .from("loans")
    .insert({ household_id: hh.id, title: "Probe Pending", amount: 10, direction: "owedToYou", counterparty_name: "Probe", date: "Today", created_by: userId, status: "pending" })
    .select("id,status")
    .single();
  check("loans status (migration-002)", !loan2Error && loan2?.status === "pending", loan2Error?.message);

  // 4c. Attachments: storage upload + row + read-back, then remove.
  const { error: upError } = await supabase.storage.from("receipts").upload(
    `${hh.id}/bill/${bill2.id}/probe.png`,
    new File(["probe"], "probe.png", { type: "image/png" })
  );
  check("storage upload (receipts bucket)", !upError, upError?.message);
  const { data: att, error: attachRowError } = await supabase
    .from("attachments")
    .insert({ household_id: hh.id, kind: "bill", owner_id: bill2.id, path: `${hh.id}/bill/${bill2.id}/probe.png`, created_by: userId })
    .select("id")
    .single();
  check("attachments row", !attachRowError, attachRowError?.message);
  const { data: signed, error: signedError } = await supabase.storage.from("receipts").createSignedUrl(`${hh.id}/bill/${bill2.id}/probe.png`, 60);
  check("storage signed URL", !signedError && Boolean(signed?.signedUrl), signedError?.message);
  if (att) await supabase.from("attachments").delete().eq("id", att.id);
  await supabase.storage.from("receipts").remove([`${hh.id}/bill/${bill2.id}/probe.png`]);

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
  check("household read-back", !billsBackError && billsBack.length === 2, billsBackError?.message);

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
