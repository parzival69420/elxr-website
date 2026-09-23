import { bottles, work } from "@/lib/content";
import { bottleColors } from "@/lib/bottles";
import WorkVial from "@/components/WorkVial";

/** Selected work: flagship cases, each figure shown with its constraint and mechanism. */
export default function Work() {
  return (
    <section id="work" className="work-section cyber-work relative z-10" aria-labelledby="work-title">
      <div className="cyber-grid">
      <p className="cyber-label" aria-hidden="true">
        Selected work
      </p>
      <div className="cyber-work-content">
      <header className="work-heading">
        <h2 id="work-title" className="cyber-title">{work.heading}</h2>
        <p>{work.subline}</p>
      </header>

      <ol className="work-list">
        {work.cases.map((c, i) => {
          const index = bottles.findIndex((b) => b.id === c.service);
          const bottle = bottles[index];
          return (
            <li
              key={c.title}
              className="work-case"
              style={{ "--case-color": bottleColors[index] } as React.CSSProperties}
            >
              <WorkVial
                index={i}
                figure={c.figure}
                label={c.figureLabel}
                fallback={bottleColors[index]}
              />
              <div className="work-body">
                <p className="work-meta">
                  {c.sector}
                  {bottle && (
                    <a href={`#detail-${bottle.id}`}>{bottle.name}</a>
                  )}
                </p>
                <h3>{c.title}</h3>
                <dl>
                  <div>
                    <dt>The constraint</dt>
                    <dd>{c.constraint}</dd>
                  </div>
                  <div>
                    <dt>What we did</dt>
                    <dd>{c.mechanism}</dd>
                  </div>
                  <div>
                    <dt>What it did</dt>
                    <dd className="work-outcome">
                      <span className="sr-only">
                        {c.figure} {c.figureLabel}.{" "}
                      </span>
                      {c.outcome}
                    </dd>
                  </div>
                </dl>
              </div>
            </li>
          );
        })}
      </ol>

      <a href={work.cta.href} className="cyber-link work-cta">
        {work.cta.label}
      </a>
      </div>
      </div>
    </section>
  );
}
