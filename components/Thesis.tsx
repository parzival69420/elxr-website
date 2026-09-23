import { thesis } from "@/lib/content";

export default function Thesis() {
  return (
    <section id="thesis" className="thesis-section theme-split relative z-10">
      <span className="ghost-word" aria-hidden="true">
        Engineered
      </span>
      <div className="theme-wrap thesis-grid">
        <h2 className="theme-display">
          {thesis.lineOne} {thesis.emphasis}
        </h2>
        <div className="theme-tile thesis-tile">
          <p>{thesis.lineTwo}</p>
        </div>
      </div>
    </section>
  );
}
