import { useState } from "react";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
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
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    // Auth actions are async in online mode, sync locally — await covers both.
    Promise.resolve(mode === "login" ? actions.logIn({ email, password }) : actions.signUp({ name, email, password })).then(
      (result) => {
        setBusy(false);
        if (!result.ok) setError(result.error);
      }
    );
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setPassword("");
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

          <h1 className="font-display font-bold text-[22px] mb-1" style={{ color: COLORS.ink }}>
            {mode === "login" ? "Welcome back" : "Join the household"}
          </h1>
          <p className="font-body text-[13px] mb-5" style={{ color: "rgba(18,49,40,0.6)" }}>
            {mode === "login"
              ? "Log in to see your bills, loans, notes, and calendar."
              : "Create the first account to start a fresh household."}
          </p>

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
            <FieldRow
              icon={<Mail size={16} color="rgba(18,49,40,0.45)" />}
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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
              {busy ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="font-body text-[12px] mt-5 text-center leading-relaxed" style={{ color: "rgba(18,49,40,0.5)" }}>
          Prototype build — accounts live only in this browser.
          <br />
          Use Sign Up to create your household.
        </p>
      </div>
    </div>
  );
}
