import { hero, thesis } from "@/lib/content";
import CyberSection, { CyberTitle } from "./cyber/CyberSection";
import { FlaskWire } from "./cyber/Wireframes";
import { IconArrow } from "./cyber/Icons";

export default function Thesis() {
  return (
    <CyberSection id="thesis" label="The thesis" wireframe={<FlaskWire />} labelledBy="thesis-title">
      <CyberTitle id="thesis-title">{thesis.emphasis}</CyberTitle>
      <p className="cyber-lead">{thesis.lineOne}</p>
      <p className="cyber-body">{thesis.lineTwo}</p>
      <div className="cyber-actions">
        <a href={hero.primaryCta.href} className="cyber-btn">
          {hero.primaryCta.label} <IconArrow />
        </a>
        <a href={hero.secondaryCta.href} className="cyber-link">
          {hero.secondaryCta.label}
        </a>
      </div>
    </CyberSection>
  );
}
