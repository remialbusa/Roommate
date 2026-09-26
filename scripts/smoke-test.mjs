import { JSDOM } from "jsdom";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "dist", "assets");
const jsFileName = readdirSync(assetsDir).find((f) => f.endsWith(".js"));
const code = readFileSync(path.join(assetsDir, jsFileName), "utf-8");

const errors = [];
const log = [];

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "http://localhost/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;

window.onerror = (msg) => errors.push(String(msg));
window.addEventListener("error", (e) => errors.push(e.error ? (e.error.stack || e.error.message) : String(e.message)));
window.addEventListener("unhandledrejection", (e) => errors.push("unhandledrejection: " + (e.reason && e.reason.stack ? e.reason.stack : e.reason)));
window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
};

global.window = window;
global.document = window.document;
Object.defineProperty(global, "navigator", { value: window.navigator, configurable: true });
global.localStorage = window.localStorage;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

function setInputValue(el, value) {
  nativeInputValueSetter.call(el, value);
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
  el.dispatchEvent(new window.Event("change", { bubbles: true }));
}

function byText(selector, text) {
  return [...window.document.querySelectorAll(selector)].find((el) => el.textContent.trim() === text);
}

function byPlaceholder(placeholder) {
  return window.document.querySelector(`input[placeholder="${placeholder}"]`);
}

async function tick(ms = 60) {
  await new Promise((r) => setTimeout(r, ms));
}

function snapshot(label) {
  const html = window.document.getElementById("root").innerHTML;
  log.push(`--- ${label} (len=${html.length}, errors so far=${errors.length}) ---`);
  return html;
}

function assertContains(label, html, needle) {
  const ok = html.includes(needle);
  log.push(`  ASSERT [${label}] contains "${needle}": ${ok ? "PASS" : "FAIL"}`);
  if (!ok) errors.push(`ASSERTION FAILED: [${label}] expected to find "${needle}"`);
}

try {
  window.eval(code);
} catch (err) {
  errors.push("SYNC EVAL ERROR: " + (err.stack || err.message));
}
await tick(200);
snapshot("initial mount (should be login screen)");
assertContains("auth screen visible", window.document.getElementById("root").innerHTML, "Welcome back");

// --- Sign up fresh (empty start, no demo users) ---
{
  const signupTab = [...window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sign Up");
  if (signupTab) signupTab.click();
  else errors.push("Sign Up tab not found");
  await tick(100);
  const nameInput = byPlaceholder("Full name");
  const emailInput = byPlaceholder("Email");
  const passInput = window.document.querySelector('input[type="password"]');
  if (nameInput && emailInput && passInput) {
    setInputValue(nameInput, "Sam Rivera");
    setInputValue(emailInput, "sam@roomie.app");
    setInputValue(passInput, "newpassword1");
  } else {
    errors.push("Sign up form fields not found");
  }
  const submit = window.document.querySelector('button[type="submit"]');
  if (submit) submit.click();
  else errors.push("Sign up submit not found");
  await tick(200);
  const html = window.document.getElementById("root").innerHTML;
  snapshot("after signup (should be empty Bills home)");
  assertContains("empty bills state", html, "No bills yet");
}

function byNav(label) {
  const navBtn = [...window.document.querySelectorAll('nav[aria-label="Primary"] button')].find((el) => el.textContent.trim() === label);
  if (navBtn) return navBtn;
  return byText("button", label);
}

// --- Click through every nav tab (empty states should not crash) ---
for (const label of ["Bills", "Lending", "Notes", "Calendar", "Activity"]) {
  const navBtn = byNav(label);
  if (navBtn) navBtn.click();
  else errors.push(`Nav button not found: ${label}`);
  await tick(100);
  snapshot(`nav -> ${label}`);
}

// --- Bills: open Add Bill modal, fill it, submit ---
{
  const navBtn = byNav("Bills");
  if (navBtn) navBtn.click();
  await tick(100);
  const addBillBtn = byText("button", "Add your first bill") || byText("button", "Add Bill");
  if (addBillBtn) addBillBtn.click();
  else errors.push("Add Bill button not found");
  await tick(100);
  const nameInput = byPlaceholder("e.g. Gas Bill");
  const amountInput = byPlaceholder("0.00");
  if (nameInput && amountInput) {
    setInputValue(nameInput, "Test Gas Bill");
    setInputValue(amountInput, "42");
  } else {
    errors.push("Add Bill form fields not found");
  }
  const modalSubmit = [...window.document.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes("Add Bill"));
  if (modalSubmit) modalSubmit.click();
  else errors.push("Add Bill submit not found");
  await tick(150);
  snapshot("after adding a bill");
  assertContains("bill total shows $42", window.document.getElementById("root").innerHTML, "$42");
}

// --- Bills: home shows the new bill with totals + quick pay ---
{
  snapshot("bills home with new bill");
  const html = window.document.getElementById("root").innerHTML;
  assertContains("bill total shows $42", html, "$42");
  assertContains("new bill row visible", html, "Test Gas Bill");
  assertContains("one-tap pay visible", html, "Pay $42");
}

// --- Lending: add a loan ---
{
  const navBtn = byNav("Lending");
  if (navBtn) navBtn.click();
  await tick(100);
  const lendBtn = byText("button", "Log your first loan") || byText("button", "Log Loan");
  if (lendBtn) lendBtn.click();
  else errors.push("Log Loan button not found");
  await tick(100);
  // Single-member household: roommate select has no options, so sign-up path needs 2nd member.
  // Create a second member via settings logout/signup is heavy in jsdom; instead assert empty-loan validation blocks submit.
  const whatFor = byPlaceholder("e.g. Groceries run");
  const amt = byPlaceholder("0.00");
  if (whatFor && amt) {
    setInputValue(whatFor, "Test loan");
    setInputValue(amt, "25");
  } else {
    errors.push("Add Loan form fields not found");
  }
  const modalSubmit = [...window.document.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes("Add Loan"));
  if (modalSubmit) modalSubmit.click();
  else errors.push("Add Loan submit not found");
  await tick(150);
  snapshot("after attempting loan with single member (validation should keep empty state)");
}

// --- Notes: add a note ---
{
  const navBtn = byNav("Notes");
  if (navBtn) navBtn.click();
  await tick(100);
  const addNoteBtn = window.document.querySelector('button[aria-label="Add note"]');
  if (addNoteBtn) addNoteBtn.click();
  else errors.push("Add note FAB not found");
  await tick(100);
  const titleInput = byPlaceholder("e.g. Parking Info");
  const bodyInput = window.document.querySelector("textarea");
  if (titleInput && bodyInput) {
    setInputValue(titleInput, "Test Note");
    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextareaSetter.call(bodyInput, "Test note body content.");
    bodyInput.dispatchEvent(new window.Event("input", { bubbles: true }));
    bodyInput.dispatchEvent(new window.Event("change", { bubbles: true }));
  } else {
    errors.push("Add Note form fields not found");
  }
  const modalSubmit = [...window.document.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes("Add Note"));
  if (modalSubmit) modalSubmit.click();
  else errors.push("Add Note submit not found");
  await tick(150);
  snapshot("after adding a note");
  assertContains("new note title visible in list", window.document.getElementById("root").innerHTML, "Test Note");
}

// --- Calendar: open add event modal ---
{
  const navBtn = byNav("Calendar");
  if (navBtn) navBtn.click();
  await tick(100);
  const addEventBtn = window.document.querySelector('button[aria-label="Add event"]');
  if (addEventBtn) addEventBtn.click();
  else errors.push("Add event FAB not found");
  await tick(100);
  const titleInput = byPlaceholder("e.g. Movie Night");
  if (titleInput) setInputValue(titleInput, "Test Event");
  else errors.push("Add Event title field not found");
  const timeInput = byPlaceholder("e.g. 7:00 PM or All day");
  if (timeInput) setInputValue(timeInput, "7:00 PM");
  const modalSubmit = [...window.document.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes("Add Event"));
  if (modalSubmit) modalSubmit.click();
  else errors.push("Add Event submit not found");
  await tick(150);
  snapshot("after adding an event");
  assertContains("new event title visible", window.document.getElementById("root").innerHTML, "Test Event");
}

// --- Activity feed: filter chips ---
{
  const navBtn = byNav("Activity");
  if (navBtn) navBtn.click();
  else errors.push("Nav Activity not found");
  await tick(100);
  const chipGroup = window.document.querySelector('[role="group"][aria-label="Filter activity"]');
  for (const chip of ["Bills", "Lending", "Notes", "Calendar", "Account", "All"]) {
    const chipBtn = chipGroup ? [...chipGroup.querySelectorAll("button")].find((b) => b.textContent.trim() === chip) : byText("button", chip);
    if (chipBtn) chipBtn.click();
    else errors.push(`Filter chip not found: ${chip}`);
    await tick(60);
  }
  snapshot("after activity filters");
  assertContains("activity shows signup", window.document.getElementById("root").innerHTML, "joined the household");
}

// --- Bills: pay via the row's one-tap button, then confirm activity log picks it up ---
{
  const navBtn = byNav("Bills");
  if (navBtn) navBtn.click();
  else errors.push("Nav Bills not found");
  await tick(100);
  const payBtn = [...window.document.querySelectorAll("button")].find((b) => b.textContent.includes("Pay $42"));
  if (payBtn) payBtn.click();
  else errors.push("One-tap Pay button not found on bill row");
  await tick(150);
  snapshot("after one-tap pay on bill row");
  assertContains("row flips to paid", window.document.getElementById("root").innerHTML, "Paid");

  const navActivity = byNav("Activity");
  if (navActivity) navActivity.click();
  else errors.push("Nav Activity not found");
  await tick(150);
  const html = window.document.getElementById("root").innerHTML;
  assertContains("bill payment shows in activity log", html, "share of Test Gas Bill");
}

// --- Second member joins: cross-user household flows ---
{
  // Log out Sam, sign up Alex
  const settingsBtns = [...window.document.querySelectorAll('button[aria-label="Household members"]')];
  if (settingsBtns[0]) settingsBtns[0].click();
  else errors.push("Settings button not found (pre-Alex logout)");
  await tick(100);
  const logoutBtn = byText("button", "Log Out");
  if (logoutBtn) logoutBtn.click();
  else errors.push("Log Out button not found (pre-Alex logout)");
  await tick(150);
  const signupTab = [...window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sign Up");
  if (signupTab) signupTab.click();
  else errors.push("Sign Up tab not found (Alex)");
  await tick(100);
  const nameInput = byPlaceholder("Full name");
  const emailInput = byPlaceholder("Email");
  const passInput = window.document.querySelector('input[type="password"]');
  if (nameInput && emailInput && passInput) {
    setInputValue(nameInput, "Alex Test");
    setInputValue(emailInput, "alex@roomie.app");
    setInputValue(passInput, "testpass12");
  } else {
    errors.push("Sign up fields not found (Alex)");
  }
  const submit = window.document.querySelector('button[type="submit"]');
  if (submit) submit.click();
  else errors.push("Sign up submit not found (Alex)");
  await tick(200);
  let html = window.document.getElementById("root").innerHTML;
  snapshot("after Alex signup (household of 2, shared bills visible)");
  assertContains("shared bill visible to Alex", html, "Test Gas Bill");
  // Roster shows both members
  const sBtns = [...window.document.querySelectorAll('button[aria-label="Household members"]')];
  if (sBtns[0]) sBtns[0].click();
  else errors.push("Settings button not found (roster check)");
  await tick(100);
  html = window.document.getElementById("root").innerHTML;
  assertContains("roster shows Sam", html, "Sam Rivera");
  assertContains("roster shows Alex", html, "Alex Test");
  const closeBtn = window.document.querySelector('button[aria-label="Close dialog"]');
  if (closeBtn) closeBtn.click();
  else errors.push("Settings close button not found (roster check)");
  await tick(100);
  // Note: tab state persists across logout, so explicitly go to Bills
  const navBillsAlex = byNav("Bills");
  if (navBillsAlex) navBillsAlex.click();
  else errors.push("Nav Bills not found (Alex)");
  await tick(100);
  // Alex adds a bill split with Sam (both checked by default).
  // Home tile and modal submit share the exact label, so tell them
  // apart by type: only the modal submit is type="submit".
  const addBillTile = [...window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Add Bill" && b.getAttribute("type") !== "submit");
  if (addBillTile) addBillTile.click();
  else errors.push("Add Bill tile not found (Alex)");
  await tick(100);
  const billName = byPlaceholder("e.g. Gas Bill");
  const billAmt = byPlaceholder("0.00");
  if (billName && billAmt) {
    setInputValue(billName, "Dinner");
    setInputValue(billAmt, "100");
  } else {
    errors.push("Add Bill fields not found (Alex)");
  }
  const billSubmit = [...window.document.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes("Add Bill"));
  if (billSubmit) billSubmit.click();
  else errors.push("Add Bill submit not found (Alex)");
  await tick(150);
  snapshot("after Alex adds split bill");
  assertContains("combined total $142", window.document.getElementById("root").innerHTML, "$142");
  // Alex logs a loan with Sam as counterparty, then fully repays it
  const navLending = byNav("Lending");
  if (navLending) navLending.click();
  else errors.push("Nav Lending not found (Alex loan)");
  await tick(100);
  const logLoanTile = [...window.document.querySelectorAll("button")].find((b) => b.textContent.includes("Lend or borrow") || b.textContent.includes("Log your first loan"));
  if (logLoanTile) logLoanTile.click();
  else errors.push("Log Loan tile not found (Alex)");
  await tick(100);
  const loanFor = byPlaceholder("e.g. Groceries run");
  const loanAmt = byPlaceholder("0.00");
  if (loanFor && loanAmt) {
    setInputValue(loanFor, "Test loan");
    setInputValue(loanAmt, "25");
  } else {
    errors.push("Add Loan fields not found (Alex)");
  }
  const loanSubmit = [...window.document.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes("Add Loan"));
  if (loanSubmit) loanSubmit.click();
  else errors.push("Add Loan submit not found (Alex)");
  await tick(150);
  snapshot("after Alex logs loan with Sam");
  assertContains("open loan count", window.document.getElementById("root").innerHTML, "1 open");
  const balancesTile = [...window.document.querySelectorAll("button")].find((b) => b.textContent.includes("Owed vs owing"));
  if (balancesTile) balancesTile.click();
  else errors.push("Balances tile not found (Alex)");
  await tick(100);
  const loanRow = [...window.document.querySelectorAll("button")].find((b) => b.textContent.includes("Test loan"));
  if (loanRow) loanRow.click();
  else errors.push("Test loan row not found (Alex)");
  await tick(100);
  const repayTile = [...window.document.querySelectorAll("button")].find((b) => b.textContent.includes("Log Repayment"));
  if (repayTile) repayTile.click();
  else errors.push("Log Repayment tile not found (Alex)");
  await tick(100);
  const paySubmit = [...window.document.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes("Log Payment"));
  if (paySubmit) paySubmit.click();
  else errors.push("Log Payment submit not found (Alex)");
  await tick(150);
  snapshot("after Alex repays loan in full");
  assertContains("loan settled", window.document.getElementById("root").innerHTML, "Fully settled");
  // Activity attributes cross-user actions to Alex
  const navActivity2 = byNav("Activity");
  if (navActivity2) navActivity2.click();
  else errors.push("Nav Activity not found (Alex check)");
  await tick(150);
  html = window.document.getElementById("root").innerHTML;
  assertContains("activity shows Alex bill", html, "Dinner");
  assertContains("activity shows Alex loan", html, "Test loan");
}

// --- Settings modal + logout ---
{
  const settingsBtns = [...window.document.querySelectorAll('button[aria-label="Household members"]')];
  if (settingsBtns[0]) settingsBtns[0].click();
  else errors.push("Settings button not found");
  await tick(100);
  snapshot("settings modal open");
  assertContains("household shows new user", window.document.getElementById("root").innerHTML, "Sam Rivera");
  // --- Change currency to Euro, close, confirm Bills re-renders in € ---
  const currencySelect = window.document.querySelector('select[aria-label="Currency"]');
  if (currencySelect) {
    const nativeSelectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    nativeSelectSetter.call(currencySelect, "EUR");
    currencySelect.dispatchEvent(new window.Event("change", { bubbles: true }));
  } else {
    errors.push("Currency select not found");
  }
  await tick(150);
  const closeDialogBtn = window.document.querySelector('button[aria-label="Close dialog"]');
  if (closeDialogBtn) closeDialogBtn.click();
  else errors.push("Settings close button not found");
  await tick(100);
  const billsNav = byNav("Bills");
  if (billsNav) billsNav.click();
  else errors.push("Nav Bills not found for currency check");
  await tick(150);
  assertContains("euro formatting applied", window.document.getElementById("root").innerHTML, "€142");
  // --- Reopen settings for logout ---
  const settingsBtns2 = [...window.document.querySelectorAll('button[aria-label="Household members"]')];
  if (settingsBtns2[0]) settingsBtns2[0].click();
  else errors.push("Settings button not found (second open)");
  await tick(100);
  // --- Switch back to Sam: the first signup is the household admin ---
  const logoutAlex = byText("button", "Log Out");
  if (logoutAlex) logoutAlex.click();
  else errors.push("Log Out button not found (Alex logout)");
  await tick(150);
  const samEmail = byPlaceholder("Email");
  const samPass = window.document.querySelector('input[type="password"]');
  if (samEmail && samPass) {
    setInputValue(samEmail, "sam@roomie.app");
    setInputValue(samPass, "newpassword1");
  } else {
    errors.push("Login fields not found (Sam re-login)");
  }
  const samLogin = window.document.querySelector('button[type="submit"]');
  if (samLogin) samLogin.click();
  else errors.push("Login submit not found (Sam re-login)");
  await tick(200);
  const sBtns3 = [...window.document.querySelectorAll('button[aria-label="Household members"]')];
  if (sBtns3[0]) sBtns3[0].click();
  else errors.push("Settings button not found (admin removal)");
  await tick(100);
  // --- Admin removes Alex ---
  let modalHtml = window.document.getElementById("root").innerHTML;
  assertContains("admin badge visible", modalHtml, "Admin");
  const removeBtn = [...window.document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Remove Alex Test");
  if (removeBtn) removeBtn.click();
  else errors.push("Remove Alex button not found (admin)");
  await tick(100);
  const confirmBtn = [...window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Confirm");
  if (confirmBtn) confirmBtn.click();
  else errors.push("Remove confirm button not found (admin)");
  await tick(150);
  modalHtml = window.document.getElementById("root").innerHTML;
  if (modalHtml.includes("alex@roomie.app")) errors.push("Alex still in roster after admin removal");
  else log.push('  ASSERT [alex removed from roster]: PASS');
  assertContains("sam still in roster", modalHtml, "Sam Rivera");
  const logoutBtn = byText("button", "Log Out");
  if (logoutBtn) logoutBtn.click();
  else errors.push("Log Out button not found");
  await tick(150);
  snapshot("after logout (should be back on login screen)");
  const html = window.document.getElementById("root").innerHTML;
  assertContains("back on auth screen after logout", html, "Welcome back");
}

console.log(log.join("\n"));

if (errors.length) {
  console.log("\n=== ERRORS CAUGHT ===");
  errors.forEach((e, i) => console.log(`[${i}]`, e));
  process.exit(1);
} else {
  console.log("\nALL INTERACTIONS COMPLETED WITH NO RUNTIME ERRORS");
}
