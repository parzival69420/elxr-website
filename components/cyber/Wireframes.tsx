/**
 * Line-art wireframes in the spirit of a technical drawing: thin strokes, crosshair
 * screw heads, dimension ticks, and one glowing accent line per drawing.
 * Purely decorative (the wrapper is aria-hidden). Strokes are styled in cyber.css.
 */

function Screw({ x, y }: { x: number; y: number }) {
  return (
    <g className="w-screw">
      <circle cx={x} cy={y} r={6} />
      <path d={`M${x - 3.5} ${y}h7M${x} ${y - 3.5}v7`} />
    </g>
  );
}

function Frame({ w, h, inset = 18 }: { w: number; h: number; inset?: number }) {
  return (
    <>
      <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} rx={14} />
      <Screw x={inset + 18} y={inset + 18} />
      <Screw x={w - inset - 18} y={inset + 18} />
      <Screw x={inset + 18} y={h - inset - 18} />
      <Screw x={w - inset - 18} y={h - inset - 18} />
    </>
  );
}

/** Thesis: an elixir bottle, drawn as a blueprint. */
export function FlaskWire() {
  return (
    <svg viewBox="0 0 400 540" className="wireframe">
      <Frame w={400} h={540} />
      {/* stopper and collar */}
      <rect x={172} y={62} width={56} height={30} rx={4} />
      <path d="M176 70h48M176 80h48" className="w-fine" />
      <rect x={160} y={92} width={80} height={16} rx={3} />
      {/* bottle */}
      <path d="M178 108v54c0 18-70 34-70 86v196c0 16 12 28 28 28h128c16 0 28-12 28-28V248c0-52-70-68-70-86v-54" />
      <path d="M190 108v58c0 16-56 30-56 82v190" className="w-fine" />
      {/* liquid */}
      <path
        d="M112 318c20-8 36 8 58 0s38-8 58 0 38 8 60 0v140c0 14-10 24-24 24H136c-14 0-24-10-24-24z"
        className="w-accent-fill"
      />
      <path d="M112 318c20-8 36 8 58 0s38-8 58 0 38 8 60 0" className="w-accent" />
      {/* label */}
      <rect x={150} y={352} width={100} height={78} rx={3} />
      <path d="M166 372h68M166 386h52M166 400h60M166 414h36" className="w-fine" />
      {/* bubbles */}
      <circle cx={140} cy={452} r={5} className="w-fine" />
      <circle cx={262} cy={438} r={7} className="w-fine" />
      <circle cx={246} cy={466} r={3.5} className="w-fine" />
      {/* dimension line */}
      <path d="M72 62v420M64 62h16M64 482h16M72 62l-4 10M72 62l4 10M72 482l-4-10M72 482l4-10" className="w-fine" />
      <text x={60} y={276} className="w-text" transform="rotate(-90 60 276)">
        H 420
      </text>
      <path d="M300 318h56M356 318v-8" className="w-fine" />
      <text x={306} y={306} className="w-text">
        FILL 62%
      </text>
    </svg>
  );
}

/** Formula index: six vials in a rack, one per formula. */
export function RackWire() {
  const levels = [0.62, 0.48, 0.7, 0.55, 0.4, 0.66];
  return (
    <svg viewBox="0 0 440 420" className="wireframe">
      <Frame w={440} h={420} />
      <path d="M56 170h328M56 184h328M56 330h328M56 344h328" />
      <path d="M70 184v176M370 184v176M60 360h20M360 360h20" />
      {levels.map((level, i) => {
        const x = 90 + i * 46;
        const top = 96;
        const bottom = 318;
        const fill = bottom - (bottom - top - 20) * level;
        return (
          <g key={i}>
            <rect x={x - 3} y={top - 14} width={32} height={14} rx={3} />
            <path d={`M${x} ${top}v${bottom - top - 13}a13 13 0 0 0 26 0V${top}`} />
            <path
              d={`M${x} ${fill}h26V${bottom - 13}a13 13 0 0 1-26 0z`}
              className="w-accent-fill"
            />
            <path d={`M${x} ${fill}h26`} className={i === 2 ? "w-accent" : "w-fine"} />
            <text x={x + 13} y={392} className="w-text" textAnchor="middle">
              F{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Manifesto: a targeting reticle. Attention, engineered. */
export function ReticleWire() {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r1 = 196;
    const r2 = i % 6 === 0 ? 182 : 189;
    return `M${220 + Math.cos(a) * r1} ${220 + Math.sin(a) * r1}L${220 + Math.cos(a) * r2} ${220 + Math.sin(a) * r2}`;
  }).join("");
  return (
    <svg viewBox="0 0 440 440" className="wireframe">
      <circle cx={220} cy={220} r={196} />
      <path d={ticks} className="w-fine" />
      <circle cx={220} cy={220} r={150} className="w-fine" />
      <circle cx={220} cy={220} r={96} />
      <circle cx={220} cy={220} r={34} className="w-accent" />
      <circle cx={220} cy={220} r={3} className="w-accent" />
      <path d="M220 8v150M220 282v150M8 220h150M282 220h150" className="w-fine" />
      <path d="M220 132A88 88 0 0 1 308 220" className="w-accent" />
      <path d="M40 40h40M40 40v40M400 40h-40M400 40v40M40 400h40M40 400v-40M400 400h-40M400 400v-40" />
      <text x={316} y={206} className="w-text">
        LOCK
      </text>
      <text x={232} y={122} className="w-text">
        0.94
      </text>
    </svg>
  );
}

/** About: a New York block, with the water tower on the roof. */
export function BuildingWire() {
  const windows: string[] = [];
  for (let row = 0; row < 7; row++)
    for (let col = 0; col < 4; col++) {
      const x = 92 + col * 26;
      const y = 250 + row * 34 + col * 15;
      windows.push(`M${x} ${y}l16 9v18l-16-9z`);
    }
  for (let row = 0; row < 7; row++)
    for (let col = 0; col < 4; col++) {
      const x = 222 + col * 26;
      const y = 295 + row * 34 - col * 15;
      windows.push(`M${x} ${y}l16 -9v18l-16 9z`);
    }
  return (
    <svg viewBox="0 0 420 560" className="wireframe">
      {/* isometric block */}
      <path d="M80 220 210 160l130 60-130 60z" />
      <path d="M80 220v260l130 60V280zM340 220v260l-130 60V280z" />
      <path d={windows.join("")} className="w-fine" />
      {/* water tower */}
      <path d="M186 120v34M234 120v34M180 154l60-10M180 144l60 10" className="w-fine" />
      <ellipse cx={210} cy={120} rx={28} ry={9} />
      <path d="M182 120V70M238 120V70" />
      <path d="M182 70c0-10 56-10 56 0M182 70l28-26 28 26" />
      <path d="M182 96c10 5 46 5 56 0" className="w-accent" />
      {/* ground and dimension */}
      <path d="M40 540h340M60 480v60" className="w-fine" />
      <text x={352} y={330} className="w-text">
        NYC
      </text>
      <text x={352} y={346} className="w-text">
        40.71 N
      </text>
    </svg>
  );
}

/** FAQ: a terminal, cursor waiting for the question. */
export function TerminalWire() {
  return (
    <svg viewBox="0 0 440 420" className="wireframe">
      <Frame w={440} h={420} />
      <rect x={56} y={64} width={328} height={292} rx={8} />
      <path d="M56 96h328" />
      <circle cx={78} cy={80} r={5} className="w-fine" />
      <circle cx={96} cy={80} r={5} className="w-fine" />
      <circle cx={114} cy={80} r={5} className="w-fine" />
      <path d="M78 130l10 8-10 8" className="w-accent" />
      <path d="M100 138h150M78 170h220M78 194h180M78 218h206" className="w-fine" />
      <path d="M78 256l10 8-10 8" className="w-accent" />
      <rect x={100} y={256} width={12} height={18} className="w-accent-fill w-accent" />
      <path d="M280 250c0-22 40-22 40 0 0 16-20 16-20 32M300 300v2" />
      <text x={70} y={388} className="w-text">
        ELXR://FAQ
      </text>
    </svg>
  );
}

/** Contact: a coupe, poured and garnished. */
export function GlassWire() {
  return (
    <svg viewBox="0 0 420 520" className="wireframe">
      <path d="M70 90h280c0 90-62 150-140 150S70 180 70 90z" />
      <path d="M86 106h248" className="w-fine" />
      <path
        d="M92 128h236c-12 56-60 92-118 92s-106-36-118-92z"
        className="w-accent-fill"
      />
      <path d="M92 128h236" className="w-accent" />
      <path d="M204 240v190M216 240v190" />
      <ellipse cx={210} cy={446} rx={96} ry={18} />
      <ellipse cx={210} cy={446} rx={60} ry={10} className="w-fine" />
      {/* garnish */}
      <path d="M268 40 214 150" />
      <circle cx={232} cy={116} r={13} />
      <circle cx={228} cy={112} r={4} className="w-fine" />
      {/* bubbles */}
      <circle cx={160} cy={168} r={4} className="w-fine" />
      <circle cx={182} cy={190} r={2.5} className="w-fine" />
      <circle cx={262} cy={176} r={3} className="w-fine" />
      {/* dimension */}
      <path d="M372 90v356M364 90h16M364 446h16" className="w-fine" />
      <text x={352} y={276} className="w-text" transform="rotate(-90 352 276)">
        150 ML
      </text>
    </svg>
  );
}
