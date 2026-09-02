/**
 * SVG bottle using the loader's fill technique (section 5: the six carousel
 * bottles are SVG, not WebGL — one context only). Fill level is static;
 * the slosh wave animates via the shared CSS keyframe.
 */
export default function BottleSVG({
  color,
  fill = 0.68,
  id,
  className,
}: {
  color: string;
  fill?: number;
  id: string;
  className?: string;
}) {
  const fillTop = 92 - fill * 74;
  const clipId = `bottle-clip-${id}`;
  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d="M22 4 h16 v14 c0 4 12 10 12 24 v46 a8 8 0 0 1 -8 8 H18 a8 8 0 0 1 -8 -8 V42 c0 -14 12 -20 12 -24 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="-20" y={fillTop} width="100" height="100" fill={color} opacity="0.92" />
        <path
          className="slosh"
          d={`M -20 ${fillTop} q 10 -4 20 0 t 20 0 t 20 0 t 20 0 t 20 0 v 6 h -100 Z`}
          fill={color}
        />
        {/* inner glass highlight */}
        <rect x="14" y="20" width="4" height="66" rx="2" fill="rgba(255,255,255,0.14)" />
      </g>
      <path
        d="M22 4 h16 v14 c0 4 12 10 12 24 v46 a8 8 0 0 1 -8 8 H18 a8 8 0 0 1 -8 -8 V42 c0 -14 12 -20 12 -24 Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(247,244,240,0.3)"
        strokeWidth="2"
      />
      {/* cork */}
      <rect x="23" y="0" width="14" height="6" rx="2" fill="rgba(247,244,240,0.35)" />
    </svg>
  );
}
