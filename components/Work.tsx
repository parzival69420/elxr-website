import { bottles, work } from "@/lib/content";

/** Selected work: flagship cases, each figure shown with its constraint and mechanism. */
export default function Work() {
  return (
    <section id="work" className="work-section relative z-10">
      <header className="work-heading">
        <h2>{work.heading}</h2>
        <p>{work.subline}</p>
      </header>

      <ol className="work-list">
        {work.cases.map((c) => {
          const bottle = bottles.find((b) => b.id === c.service);
          return (
            <li
              key={c.title}
              className="work-case"
              style={{ "--case-color": bottle?.liquidColor } as React.CSSProperties}
            >
              <div className="work-figure" aria-hidden="true">
                <span>{c.figure}</span>
                <small>{c.figureLabel}</small>
              </div>
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

      <a href={work.cta.href} className="btn-secondary work-cta">
        {work.cta.label}
      </a>
    </section>
  );
}
