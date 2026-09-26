import { useId } from "react";

export default function BackgroundTexture() {
  const patternId = useId().replace(/:/g, "p");
  return (
    <svg className="fixed inset-0 w-full h-full -z-10 pointer-events-none" aria-hidden="true" style={{ opacity: 0.28 }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={patternId} width="220" height="220" patternUnits="userSpaceOnUse">
          <path d="M0 110 Q 55 60, 110 110 T 220 110" fill="none" stroke="#C9BF9D" strokeWidth="1" />
          <path d="M0 40 Q 55 -10, 110 40 T 220 40" fill="none" stroke="#C9BF9D" strokeWidth="1" />
          <path d="M0 180 Q 55 130, 110 180 T 220 180" fill="none" stroke="#C9BF9D" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
