import { User } from "lucide-react";

export default function Avatar({ bg, size = 36, ring, name }) {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bg || "#8A7F6B",
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined,
      }}
      aria-hidden="true"
    >
      {initials ? (
        <span className="font-body font-bold" style={{ fontSize: size * 0.34, color: "rgba(255,255,255,0.95)" }}>
          {initials}
        </span>
      ) : (
        <User size={size * 0.5} color="rgba(255,255,255,0.85)" strokeWidth={2} />
      )}
    </div>
  );
}
