import { useState } from "react";
import { LogOut, Download } from "lucide-react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import { SelectField, CheckboxRow } from "./FormControls";
import { DeleteButton } from "./actions";
import { COLORS } from "../theme";
import { CURRENCIES } from "../utils/format";
import { useAppState } from "../state/AppStateContext";

function SectionTitle({ children }) {
  return (
    <h3 className="font-body font-bold text-[12px] uppercase tracking-wider mb-2" style={{ color: "rgba(18,49,40,0.5)" }}>
      {children}
    </h3>
  );
}

export default function SettingsModal() {
  const { state, actions, currentUser } = useAppState();
  const users = Object.values(state.users);
  const settings = state.settings || { currency: "USD", logReminders: true };
  const isAdmin = currentUser?.isAdmin === true;
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  function exportData() {
    const { ui, ...persisted } = state;
    const blob = new Blob([JSON.stringify(persisted, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roomie-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleEraseAll() {
    actions.resetData();
    actions.closeSettings();
  }

  return (
    <Modal open={state.ui.settingsOpen} onClose={actions.closeSettings} title="Settings">
      <div className="max-h-[70vh] overflow-y-auto app-scroll -mx-1 px-1">
        <SectionTitle>Household</SectionTitle>
        <p className="font-body text-[13px] mb-3" style={{ color: "rgba(18,49,40,0.6)" }}>
          {users.length === 0
            ? "No members yet — invite roommates by having them sign up on this device."
            : "Everyone sharing this apartment and its bills, loans, notes, and calendar."}
        </p>
        <div className="flex flex-col gap-3 mb-6">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <Avatar bg={u.bg} name={u.name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-[14.5px] truncate" style={{ color: COLORS.ink }}>
                  {u.name}
                </div>
                <div className="font-body text-[12px] truncate" style={{ color: "rgba(18,49,40,0.5)" }}>
                  {u.email}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {u.isAdmin && (
                  <span
                    className="font-body font-semibold text-[11px] px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.ink }}
                  >
                    Admin
                  </span>
                )}
                {currentUser?.id === u.id && (
                  <span
                    className="font-body font-semibold text-[11px] px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(143,232,79,0.35)", color: COLORS.ink }}
                  >
                    You
                  </span>
                )}
                {isAdmin && currentUser?.id !== u.id && (
                  confirmRemoveId === u.id ? (
                    <>
                      <button
                        onClick={() => {
                          actions.removeMember(u.id, currentUser.id);
                          setConfirmRemoveId(null);
                        }}
                        className="font-body font-semibold text-[11px] px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: COLORS.ember, color: "#F1ECDC" }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        aria-label={`Cancel removing ${u.name}`}
                        className="font-body font-semibold text-[11px] px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "rgba(18,49,40,0.08)", color: COLORS.ink }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveId(u.id)}
                      aria-label={`Remove ${u.name}`}
                      className="font-body font-semibold text-[11px] px-2.5 py-1 rounded-full"
                      style={{ border: "1.5px solid rgba(240,73,42,0.5)", color: COLORS.ember }}
                    >
                      Remove
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>Preferences</SectionTitle>
        <div className="mb-6">
          <SelectField
            label="Currency"
            aria-label="Currency"
            value={settings.currency}
            onChange={(e) => actions.updateSettings({ currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} — {c.label} ({c.code})
              </option>
            ))}
          </SelectField>
          <CheckboxRow
            label="Log reminders to the Activity feed"
            checked={settings.logReminders !== false}
            onChange={(e) => actions.updateSettings({ logReminders: e.target.checked })}
          />
        </div>

        <SectionTitle>Data</SectionTitle>
        {isAdmin ? (
          <div className="flex flex-col gap-2.5 mb-6">
            <button
              onClick={exportData}
              className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 font-body font-semibold text-[13.5px] transition-transform active:scale-[0.98]"
              style={{ backgroundColor: "rgba(18,49,40,0.08)", color: COLORS.ink }}
            >
              <Download size={15} />
              Export household data (JSON)
            </button>
            <DeleteButton label="Clear activity log" onDelete={actions.clearActivity} />
            <DeleteButton label="Erase all bills, loans, notes & events" onDelete={handleEraseAll} />
            <p className="font-body text-[11.5px]" style={{ color: "rgba(18,49,40,0.45)" }}>
              Erasing keeps member accounts — only household content is removed.
            </p>
          </div>
        ) : (
          <p className="font-body text-[12.5px] mb-6" style={{ color: "rgba(18,49,40,0.5)" }}>
            Only the household admin can manage data and members.
          </p>
        )}

        <button
          onClick={() => {
            actions.closeSettings();
            actions.logOut();
          }}
          className="w-full rounded-xl py-3 flex items-center justify-center gap-2 font-body font-semibold text-[14px] transition-transform active:scale-[0.98]"
          style={{ backgroundColor: COLORS.ember, color: "#F1ECDC" }}
        >
          <LogOut size={16} />
          Log Out
        </button>

        <p className="font-body text-[11.5px] mt-4 text-center" style={{ color: "rgba(18,49,40,0.4)" }}>
          Roomie App · v1.1
        </p>
      </div>
    </Modal>
  );
}
