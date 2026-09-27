import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, X } from "lucide-react";
import Modal from "./Modal";
import { COLORS } from "../theme";
import { isOnline } from "../lib/supabase";
import { useAppState } from "../state/AppStateContext";

/**
 * Receipt / photo attachments for bills, loans, notes and events.
 * Online: files live in the private Supabase Storage bucket, rows in
 * the attachments table, synced like everything else. Local mode has
 * no file store, so it shows an explanatory note instead.
 */
export default function AttachmentsSection({ kind, ownerId, title = "Attachments", dark = false }) {
  const { state, actions } = useAppState();
  const online = isOnline();
  const items = (state.attachments || []).filter((a) => a.kind === kind && String(a.ownerId) === String(ownerId));
  const [urls, setUrls] = useState({});
  const [viewer, setViewer] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const ink = dark ? "#F1ECDC" : COLORS.ink;
  const muted = dark ? "rgba(241,236,220,0.55)" : "rgba(18,49,40,0.55)";
  const chipBg = dark ? "rgba(241,236,220,0.1)" : "rgba(18,49,40,0.08)";
  const thumbBg = dark ? "rgba(241,236,220,0.08)" : "rgba(18,49,40,0.08)";

  useEffect(() => {
    let alive = true;
    if (!online || items.length === 0) {
      setUrls({});
      return;
    }
    Promise.all(
      items.map(async (a) => [a.id, await actions.getAttachmentUrl(a.path)])
    ).then((pairs) => {
      if (!alive) return;
      const next = {};
      for (const [id, url] of pairs) if (url) next[id] = url;
      setUrls(next);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, items.map((a) => a.id).join(",")]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    const result = await actions.addAttachment(kind, ownerId, file);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  if (!online) {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: dark ? "rgba(241,236,220,0.06)" : "rgba(18,49,40,0.04)" }}>
        <h4 className="font-body font-semibold text-[13px] mb-1" style={{ color: ink }}>
          {title}
        </h4>
        <p className="font-body text-[12.5px]" style={{ color: muted }}>
          Photo attachments need online mode — connect Supabase to store {kind === "note" || kind === "event" ? "photos" : "receipts"} here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="font-body font-semibold text-[13px]" style={{ color: muted }}>
          {title} {items.length > 0 && `· ${items.length}`}
        </h4>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body font-semibold text-[12px] transition-transform active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: chipBg, color: ink }}
        >
          <Camera size={13} />
          {busy ? "Uploading…" : "Add photo"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} aria-label="Attach a photo" />
      </div>
      {error && (
        <p className="font-body text-[12.5px] mb-2" style={{ color: COLORS.ember }} role="alert">
          {error}
        </p>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.map((a) => (
            <div key={a.id} className="relative group">
              <button
                onClick={() => urls[a.id] && setViewer(urls[a.id])}
                className="block w-full aspect-square rounded-xl overflow-hidden transition-transform active:scale-[0.97]"
                style={{ backgroundColor: thumbBg }}
                aria-label="View photo"
              >
                {urls[a.id] ? (
                  <img src={urls[a.id]} alt="Attachment" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="h-full w-full flex items-center justify-center">
                    <Camera size={18} color={muted} />
                  </span>
                )}
              </button>
              <button
                onClick={() => actions.deleteAttachment(a.id)}
                aria-label="Delete photo"
                className="absolute top-1 right-1 h-7 w-7 rounded-full flex items-center justify-center shadow"
                style={{ backgroundColor: "rgba(12,34,27,0.75)" }}
              >
                <Trash2 size={13} color="#F1ECDC" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Modal open={Boolean(viewer)} onClose={() => setViewer(null)} title="Photo">
        {viewer && <img src={viewer} alt="Attachment full view" className="w-full rounded-2xl" />}
        <button
          onClick={() => setViewer(null)}
          className="mt-4 w-full rounded-xl py-3 flex items-center justify-center gap-2 font-body font-semibold text-[14px]"
          style={{ backgroundColor: "rgba(18,49,40,0.08)", color: COLORS.ink }}
        >
          <X size={15} />
          Close
        </button>
      </Modal>
    </div>
  );
}
