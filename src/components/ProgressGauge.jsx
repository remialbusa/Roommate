import { useEffect, useRef, useState } from "react";
import { useId } from "react";
import { COLORS } from "../theme";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  // Sweep 1: travel over the top of the dial (SVG y-down = visually clockwise).
  // Sweep 0 mirrors the arc below the diameter line, outside the viewBox.
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * Semicircle gauge with a hatched "remaining" arc and a needle,
 * matching the reference image's Monthly Limit dial. `percent`
 * drives both the filled arc and the needle angle.
 */
export default function ProgressGauge({ percent }) {
  const rawId = useId().replace(/:/g, "g");
  const patternId = `gauge-${rawId}`;
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  // Animated dial value: sweeps from the previous value to `pct`
  // on mount and on every change, so fill + needle move together.
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = pct;
      setShown(pct);
      return;
    }
    const from = shownRef.current;
    if (from === pct) {
      setShown(pct);
      return;
    }
    let raf;
    const start = performance.now();
    const dur = 800;
    function frame(t) {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = from + (pct - from) * eased;
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  const cx = 150,
    cy = 140,
    r = 108,
    stroke = 30;
  const boundaryAngle = 180 - (shown / 100) * 180;
  const filledPath = describeArc(cx, cy, r, 180, boundaryAngle);
  const remainingPath = describeArc(cx, cy, r, boundaryAngle, 0);
  const needle = polarToCartesian(cx, cy, r - stroke / 2 - 6, boundaryAngle);
  const needleBaseL = polarToCartesian(cx, cy, 10, boundaryAngle + 100);
  const needleBaseR = polarToCartesian(cx, cy, 10, boundaryAngle - 100);

  return (
    <svg viewBox="0 0 300 175" className="w-full h-auto" role="img" aria-label={`${Math.round(pct)} percent paid`}>
      <defs>
        <pattern id={patternId} width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke={COLORS.ink} strokeWidth="1.6" opacity="0.7" />
        </pattern>
      </defs>
      {pct < 100 && <path d={remainingPath} fill="none" stroke={`url(#${patternId})`} strokeWidth={stroke} strokeLinecap="round" />}
      {pct > 0 && <path d={filledPath} fill="none" stroke={COLORS.ink} strokeWidth={stroke} strokeLinecap="round" />}
      <polygon
        points={`${needle.x},${needle.y} ${needleBaseL.x},${needleBaseL.y} ${needleBaseR.x},${needleBaseR.y}`}
        fill={COLORS.ink}
      />
      <circle cx={cx} cy={cy} r="9" fill={COLORS.ink} />
    </svg>
  );
}
