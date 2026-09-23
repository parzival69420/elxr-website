import { manifesto } from "@/lib/content";
import CyberSection, { CyberTitle } from "./cyber/CyberSection";
import { ReticleWire } from "./cyber/Wireframes";

export default function Manifesto() {
  return (
    <CyberSection label="Manifesto" wireframe={<ReticleWire />} className="cyber-manifesto" labelledBy="manifesto-title">
      <CyberTitle id="manifesto-title" size="lg">
        {manifesto.headline}
      </CyberTitle>
      <p className="cyber-lead">{manifesto.subline}</p>
    </CyberSection>
  );
}
