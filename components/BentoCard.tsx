import type { CSSProperties } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** "$3M+" → ["$3", "M+"], "7+ years" → ["7", "+ years"]: the suffix takes the accent. */
function splitFigure(value: string): [string, string] {
  const match = value.match(/^([$#]?[\d.,]+)(.*)$/);
  return match ? [match[1], match[2]] : [value, ""];
}

type BentoCardProps = {
  index: number;
  total: number;
  tag: string;
  value: string;
  caption: string;
  className?: string;
  style?: CSSProperties;
  /** Hide the whole card from assistive tech when its figure is repeated elsewhere. */
  decorative?: boolean;
};

/**
 * Spec-sheet card: an index and tag across the top, the figure inside a
 * ruled frame, a serial line and fill-level dots along the bottom.
 * Only the figure and caption carry meaning; the rest is aria-hidden trim.
 */
export default function BentoCard({
  index,
  total,
  tag,
  value,
  caption,
  className = "",
  style,
  decorative,
}: BentoCardProps) {
  const [main, suffix] = splitFigure(value);
  return (
    <div className={`bento-card ${className}`} style={style} aria-hidden={decorative || undefined}>
      <div className="bento-head" aria-hidden="true">
        <span className="bento-index">{pad(index)}</span>
        <span className="bento-tag">{tag}</span>
      </div>
      <div className="bento-frame">
        <p className="bento-value">
          {main}
          {suffix && <span className="bento-suffix">{suffix}</span>}
        </p>
        <p className="bento-caption">{caption}</p>
      </div>
      <div className="bento-foot" aria-hidden="true">
        <span className="bento-serial">
          ELXR / {pad(index)}—{pad(total)}
        </span>
        <span className="bento-barcode" />
        <span className="bento-levels">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}
