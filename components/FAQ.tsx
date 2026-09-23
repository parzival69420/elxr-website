import { faq } from "@/lib/content";
import CyberSection, { CyberTitle } from "./cyber/CyberSection";
import { TerminalWire } from "./cyber/Wireframes";

export default function FAQ() {
  return (
    <CyberSection label="FAQ" wireframe={<TerminalWire />} labelledBy="faq-title">
      <CyberTitle id="faq-title">{faq.heading}</CyberTitle>
      <div className="cyber-rows">
        {faq.items.map((item, i) => (
          <details key={item.q} className="cyber-row is-faq">
            <summary>
              <span className="cyber-row-index">Q.0{i + 1}</span>
              <h3>{item.q}</h3>
              <span className="cyber-row-toggle" aria-hidden="true" />
            </summary>
            <p className="cyber-body cyber-answer">{item.a}</p>
          </details>
        ))}
      </div>
    </CyberSection>
  );
}
