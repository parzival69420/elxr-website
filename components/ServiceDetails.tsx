import { bottles, servicesIntro } from "@/lib/content";

/** Complete service copy remains available in native disclosures without JavaScript or WebGL. */
export default function ServiceDetails() {
  return (
    <section
      id="formula-index"
      className="service-index theme-split relative z-10"
      aria-labelledby="formula-index-heading"
    >
      <div className="theme-wrap">
      <div className="service-index-heading">
        <h2 id="formula-index-heading" className="theme-display">
          Every formula, in full.
        </h2>
        <p>{servicesIntro.indexCue}</p>
      </div>
      {bottles.map((b, idx) => (
        <details
          key={b.id}
          id={`detail-${b.id}`}
          className="service-disclosure"
        >
          <summary>
            <span className="service-index-number">0{idx + 1}</span>
            <h3>{b.name}</h3>
            <span className="service-index-tagline">{b.tagline}</span>
            <span className="service-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="service-detail-body">
            <div>
              <p className="service-lead">{b.oneLiner}</p>
              {b.bodyCopy?.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <h4 className="section-kicker">{servicesIntro.inside}</h4>
              <ul>
                {b.whatsInside.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <a href={b.cta.href} className="service-contact">
                {b.cta.label}
              </a>
            </div>
            {b.proof.length > 0 && (
              <div className="service-proof">
                {b.proof.map((p, i) => (
                  <blockquote key={i}>
                    <p>{p.body}</p>
                    <p className="service-stat">{p.stat}</p>
                  </blockquote>
                ))}
              </div>
            )}
          </div>
        </details>
      ))}
      </div>
    </section>
  );
}
