import type { ReactNode } from "react";

/**
 * Spec-sheet section: a vertical label down the left edge, the content, and a
 * line-art wireframe bleeding off the right edge. A dotted rule separates sections.
 */
export default function CyberSection({
  id,
  label,
  wireframe,
  className = "",
  labelledBy,
  children,
}: {
  id?: string;
  label: string;
  wireframe?: ReactNode;
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`cyber-section relative z-10 ${className}`}
      aria-labelledby={labelledBy}
    >
      <div className="cyber-grid">
        <p className="cyber-label" aria-hidden="true">
          {label}
        </p>
        <div className="cyber-content">{children}</div>
      </div>
      {wireframe && (
        <div className="cyber-wire" aria-hidden="true">
          {wireframe}
        </div>
      )}
    </section>
  );
}

/** Uppercase technical heading with the short accent bar beneath it. */
export function CyberTitle({
  id,
  children,
  as: Tag = "h2",
  size = "md",
}: {
  id?: string;
  children: ReactNode;
  as?: "h2" | "h3";
  size?: "md" | "lg";
}) {
  return (
    <Tag id={id} className={`cyber-title ${size === "lg" ? "is-lg" : ""}`}>
      {children}
    </Tag>
  );
}

/** Icon + "Label: value" rows, the reference's spec list. */
export function SpecList({
  items,
}: {
  items: { icon: ReactNode; label: string; value: ReactNode }[];
}) {
  return (
    <dl className="spec-list">
      {items.map((item) => (
        <div key={item.label}>
          <span className="spec-icon" aria-hidden="true">
            {item.icon}
          </span>
          <dt>{item.label}:</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
