import { bottles, servicesIntro } from "@/lib/content";

/** Complete service copy remains available in native disclosures without JavaScript or WebGL. */
export default function ServiceDetails() {
  return (
    <section
      className="service-index relative z-10"
      aria-label="Service details and results"
    >
      <div className="service-index-heading">
        <p className="section-kicker">{servicesIntro.index}</p>
        <span>{servicesIntro.indexCue}</span>
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
    </section>
  );
}
