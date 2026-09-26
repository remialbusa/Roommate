import { useState } from "react";
import { Home, Ticket } from "lucide-react";
import Logo from "../../components/Logo";
import { TextField, SubmitRow } from "../../components/FormControls";
import { COLORS } from "../../theme";
import { useAppState } from "../../state/AppStateContext";

/**
 * Shown online when signed in but not yet in a household:
 * create a new one (you become admin) or join with an invite code.
 */
export default function HouseholdSetup() {
  const { actions, currentUser } = useAppState();
  const [tab, setTab] = useState("create"); // "create" | "join"
  const [householdName, setHouseholdName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const result =
      tab === "create" ? await actions.createHousehold(householdName) : await actions.joinHousehold(code);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  async function handleLogout() {
    await actions.logOut();
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
            {currentUser ? `Hi ${currentUser.name.split(" ")[0]} 👋` : "Set up your household"}
          </h1>
          <p className="font-body text-[13px] mb-5" style={{ color: "rgba(18,49,40,0.6)" }}>
            Create a household and invite roommates with a code, or join theirs.
          </p>

          <div className="flex rounded-xl p-1 mb-6" style={{ backgroundColor: "rgba(18,49,40,0.06)" }}>
            <button
              onClick={() => {
                setTab("create");
                setError("");
              }}
              className="flex-1 py-2.5 rounded-lg font-body font-semibold text-[13.5px] transition-colors"
              style={{ backgroundColor: tab === "create" ? COLORS.ink : "transparent", color: tab === "create" ? "#F1ECDC" : COLORS.ink }}
            >
              New household
            </button>
            <button
              onClick={() => {
                setTab("join");
                setError("");
              }}
              className="flex-1 py-2.5 rounded-lg font-body font-semibold text-[13.5px] transition-colors"
              style={{ backgroundColor: tab === "join" ? COLORS.ink : "transparent", color: tab === "join" ? "#F1ECDC" : COLORS.ink }}
            >
              Join with code
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === "create" ? (
              <TextField
                label="Household name"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g. Maple St Apartment"
                maxLength={40}
              />
            ) : (
              <TextField
                label="Invite code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. KQ7X2P"
                maxLength={12}
                required
              />
            )}

            {error && (
              <p className="font-body text-[13px] mb-4 px-1" style={{ color: COLORS.ember }} role="alert">
                {error}
              </p>
            )}

            <SubmitRow onCancel={handleLogout} submitLabel={busy ? "Please wait…" : tab === "create" ? "Create household" : "Join household"} />
          </form>
          <p className="font-body text-[11.5px] mt-3 text-center" style={{ color: "rgba(18,49,40,0.45)" }}>
            {tab === "create" ? "Cancel signs you out." : "Ask your admin for the code — it's in their Settings."}
          </p>
        </div>

        <div className="mt-5 rounded-2xl p-4 flex items-center gap-2.5" style={{ backgroundColor: "rgba(18,49,40,0.05)" }}>
          {tab === "create" ? <Home size={15} color="rgba(18,49,40,0.5)" /> : <Ticket size={15} color="rgba(18,49,40,0.5)" />}
          <p className="font-body text-[12px]" style={{ color: "rgba(18,49,40,0.55)" }}>
            {tab === "create" ? "You'll be the household admin." : "You'll join as a member."}
          </p>
        </div>
      </div>
    </div>
  );
}
