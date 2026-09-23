import { bottles, servicesIntro } from "@/lib/content";
import CyberSection, { CyberTitle, SpecList } from "./cyber/CyberSection";
import { RackWire } from "./cyber/Wireframes";
import { IconArrow, IconCube, IconLayers } from "./cyber/Icons";

/** Complete service copy in native disclosures: readable without JavaScript or WebGL. */
export default function ServiceDetails() {
  return (
    <CyberSection
      id="formula-index"
      label={servicesIntro.index}
      wireframe={<RackWire />}
      className="cyber-index"
      labelledBy="formula-index-heading"
    >
      <CyberTitle id="formula-index-heading">Every formula, in full.</CyberTitle>
      <p className="cyber-body">{servicesIntro.indexCue}</p>
      <div className="cyber-rows">
        {bottles.map((b, idx) => (
          <details key={b.id} id={`detail-${b.id}`} className="cyber-row">
            <summary>
              <span className="cyber-row-index">F-0{idx + 1}</span>
              <h3>{b.name}</h3>
              <span className="cyber-row-note">{b.tagline}</span>
              <span className="cyber-row-toggle" aria-hidden="true" />
            </summary>
            <div className="cyber-row-body">
              <div>
                <p className="cyber-lead is-small">{b.oneLiner}</p>
                {b.bodyCopy?.map((p, i) => (
                  <p key={i} className="cyber-body">
                    {p}
                  </p>
                ))}
                <SpecList
                  items={[
                    { icon: <IconCube />, label: servicesIntro.inside, value: b.whatsInside.join(", ") },
                    { icon: <IconLayers />, label: "Formula", value: b.tagline },
                  ]}
                />
                <a href={b.cta.href} className="cyber-btn is-small">
                  {b.cta.label.replace(/\s*→\s*$/, "")} <IconArrow />
                </a>
              </div>
              {b.proof.length > 0 && (
                <div className="cyber-proof">
                  {b.proof.map((p, i) => (
                    <blockquote key={i}>
                      <p>{p.body}</p>
                      <p className="cyber-proof-stat">{p.stat}</p>
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </CyberSection>
  );
}
