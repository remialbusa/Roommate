import { useState } from "react";
import { Lock } from "lucide-react";
import Logo from "../../components/Logo";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";

/** Second step of the email reset flow: shown after Supabase reports a
 *  PASSWORD_RECOVERY event, so the new password is chosen inside the app. */
export default function ResetPassword() {
  const { actions } = useAppState();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    Promise.resolve(actions.updatePassword(password)).then((result) => {
      setBusy(false);
      if (!result.ok) setError(result.error);
    });
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
          <h1 className="font-display font-bold text-[22px] mb-1" style={{ color: COLORS.ink }}>
            Choose a new password
          </h1>
          <p className="font-body text-[13px] mb-5" style={{ color: "rgba(18,49,40,0.6)" }}>
            This replaces the password on your Roomie account.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 border mb-4 focus-within:ring-2 focus-within:ring-[#8FE84F] focus-within:border-transparent transition-shadow"
              style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(18,49,40,0.15)" }}
            >
              <Lock size={16} color="rgba(18,49,40,0.45)" />
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-transparent outline-none font-body text-[14px] flex-1 placeholder:text-[rgba(18,49,40,0.35)]"
                style={{ color: COLORS.ink }}
              />
            </div>
            <div
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 border mb-4 focus-within:ring-2 focus-within:ring-[#8FE84F] focus-within:border-transparent transition-shadow"
              style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(18,49,40,0.15)" }}
            >
              <Lock size={16} color="rgba(18,49,40,0.45)" />
              <input
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="bg-transparent outline-none font-body text-[14px] flex-1 placeholder:text-[rgba(18,49,40,0.35)]"
                style={{ color: COLORS.ink }}
              />
            </div>

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
              {busy ? "Please wait…" : "Save password"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => actions.logOut()}
            className="w-full mt-3 py-2.5 font-body text-[13px] underline underline-offset-2"
            style={{ color: "rgba(18,49,40,0.55)" }}
          >
            Back to log in
          </button>
        </div>
      </div>
    </div>
  );
}
