import { useState } from "react";
import { Mail, Lock, User as UserIcon, Home, Ticket } from "lucide-react";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
import { isOnline } from "../../lib/supabase";
import { useAppState } from "../../state/AppStateContext";

function FieldRow({ icon, ...props }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 border mb-4 focus-within:ring-2 focus-within:ring-[#8FE84F] focus-within:border-transparent transition-shadow"
      style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(18,49,40,0.15)" }}
    >
      {icon}
      <input
        {...props}
        className="bg-transparent outline-none font-body text-[14px] flex-1 placeholder:text-[rgba(18,49,40,0.35)]"
        style={{ color: COLORS.ink }}
      />
    </div>
  );
}

export default function AuthScreen() {
  const { actions } = useAppState();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(""); // forgot-password confirmation
  const online = isOnline();
  // Online signup folds household setup in: create new or join by code.
  const [householdTab, setHouseholdTab] = useState("create");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    if (mode === "forgot") {
      if (!online && newPassword !== confirm) {
        setBusy(false);
        setError("Passwords don't match.");
        return;
      }
      const result = online
        ? actions.forgotPassword(email)
        : actions.resetPassword({ email, password: newPassword });
      // Auth actions are async in online mode, sync locally — await covers both.
      Promise.resolve(result).then((r) => {
        setBusy(false);
        if (!r.ok) setError(r.error);
        else
          setDone(
            online
              ? `We sent a reset link to ${email.trim()}. Open it on this device to choose a new password.`
              : "Password updated. Log in with your new password."
          );
      });
      return;
    }

    const payload =
      mode === "login"
        ? { email, password }
        : online
          ? {
              name,
              email,
              password,
              householdName: householdTab === "create" ? householdName : "",
              inviteCode: householdTab === "join" ? inviteCode : "",
            }
          : { name, email, password };
    // Auth actions are async in online mode, sync locally — await covers both.
    Promise.resolve(mode === "login" ? actions.logIn(payload) : actions.signUp(payload)).then((result) => {
      setBusy(false);
      if (!result.ok) setError(result.error);
    });
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setPassword("");
    setNewPassword("");
    setConfirm("");
    setDone("");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ backgroundColor: COLORS.cream }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <Logo />
          <span className="font-display font-bold text-[20px]" style={{ color: COLORS.ink }}>
            Roomie
          </span>
        </div>

        <div className="anim-screen rounded-[32px] p-6" style={{ backgroundColor: COLORS.creamCard, boxShadow: "0 16px 48px rgba(18,49,40,0.12)" }}>
          {mode !== "forgot" && (
            <div className="flex rounded-xl p-1 mb-6" style={{ backgroundColor: "rgba(18,49,40,0.06)" }}>
              <button
                onClick={() => switchMode("login")}
                className="flex-1 py-2.5 rounded-lg font-body font-semibold text-[13.5px] transition-colors"
                style={{ backgroundColor: mode === "login" ? COLORS.ink : "transparent", color: mode === "login" ? "#F1ECDC" : COLORS.ink }}
              >
                Log In
              </button>
              <button
                onClick={() => switchMode("signup")}
                className="flex-1 py-2.5 rounded-lg font-body font-semibold text-[13.5px] transition-colors"
                style={{ backgroundColor: mode === "signup" ? COLORS.ink : "transparent", color: mode === "signup" ? "#F1ECDC" : COLORS.ink }}
              >
                Sign Up
              </button>
            </div>
          )}

          <h1 className="font-display font-bold text-[22px] mb-1" style={{ color: COLORS.ink }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Join the household" : "Reset your password"}
          </h1>
          <p className="font-body text-[13px] mb-5" style={{ color: "rgba(18,49,40,0.6)" }}>
            {mode === "login"
              ? "Log in to see your bills, loans, notes, and calendar."
              : mode === "signup"
                ? "Create the first account to start a fresh household."
                : online
                  ? "Enter your email and we'll send you a link to set a new password."
                  : "Choose a new password for an account saved in this browser."}
          </p>

          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.lime }}>
                {online ? <Mail size={20} color={COLORS.ink} /> : <Lock size={20} color={COLORS.ink} />}
              </div>
              <p className="font-body font-semibold text-[15px] mb-1.5" style={{ color: COLORS.ink }} role="status">
                {online ? "Check your email" : "Password updated"}
              </p>
              <p className="font-body text-[13px] mb-5 leading-relaxed" style={{ color: "rgba(18,49,40,0.6)" }}>
                {done}
              </p>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full rounded-xl py-3.5 font-body font-semibold text-[14.5px] transition-transform active:scale-[0.98]"
                style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
              >
                Back to log in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <FieldRow
                  icon={<UserIcon size={16} color="rgba(18,49,40,0.45)" />}
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={40}
                />
              )}
              {mode === "signup" && online && (
                <div className="mb-4">
                  <div className="flex rounded-xl p-1 mb-3" style={{ backgroundColor: "rgba(18,49,40,0.06)" }}>
                    <button
                      type="button"
                      onClick={() => setHouseholdTab("create")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-body font-semibold text-[12.5px] transition-colors"
                      style={{ backgroundColor: householdTab === "create" ? COLORS.ink : "transparent", color: householdTab === "create" ? "#F1ECDC" : COLORS.ink }}
                    >
                      <Home size={13} />
                      New household
                    </button>
                    <button
                      type="button"
                      onClick={() => setHouseholdTab("join")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-body font-semibold text-[12.5px] transition-colors"
                      style={{ backgroundColor: householdTab === "join" ? COLORS.ink : "transparent", color: householdTab === "join" ? "#F1ECDC" : COLORS.ink }}
                    >
                      <Ticket size={13} />
                      Join with code
                    </button>
                  </div>
                  {householdTab === "create" ? (
                    <FieldRow
                      icon={<Home size={16} color="rgba(18,49,40,0.45)" />}
                      type="text"
                      placeholder="Household name (e.g. Maple St)"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      maxLength={40}
                    />
                  ) : (
                    <FieldRow
                      icon={<Ticket size={16} color="rgba(18,49,40,0.45)" />}
                      type="text"
                      placeholder="Invite code (e.g. KQ7X2P)"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={12}
                      required
                    />
                  )}
                </div>
              )}
              <FieldRow
                icon={<Mail size={16} color="rgba(18,49,40,0.45)" />}
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {mode !== "forgot" && (
                <FieldRow
                  icon={<Lock size={16} color="rgba(18,49,40,0.45)" />}
                  type="password"
                  placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                />
              )}

              {mode === "login" && (
                <div className="flex justify-end -mt-1 mb-4 px-1">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="font-body text-[12.5px] underline underline-offset-2"
                    style={{ color: "rgba(18,49,40,0.55)" }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === "forgot" && !online && (
                <>
                  <FieldRow
                    icon={<Lock size={16} color="rgba(18,49,40,0.45)" />}
                    type="password"
                    placeholder="New password (min 6 characters)"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <FieldRow
                    icon={<Lock size={16} color="rgba(18,49,40,0.45)" />}
                    type="password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </>
              )}

              {error && (
                <p className="font-body text-[13px] mb-4 px-1" style={{ color: COLORS.ember }} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl py-3.5 font-body font-semibold text-[14.5px] transition-transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
              >
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Log In"
                    : mode === "signup"
                      ? "Create Account"
                      : online
                        ? "Send reset link"
                        : "Update password"}
              </button>

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="w-full mt-3 py-2.5 font-body text-[13px] underline underline-offset-2"
                  style={{ color: "rgba(18,49,40,0.55)" }}
                >
                  Back to log in
                </button>
              )}
            </form>
          )}
        </div>

        <p className="font-body text-[12px] mt-5 text-center leading-relaxed" style={{ color: "rgba(18,49,40,0.5)" }}>
          {online ? (
            <>
              Shared household — your roommates join with
              <br />
              the invite code from Settings.
            </>
          ) : (
            <>
              Prototype build — accounts live only in this browser.
              <br />
              Use Sign Up to create your household.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
