import { about, contact } from "@/lib/content";
import CyberSection, { CyberTitle, SpecList } from "./cyber/CyberSection";
import { BuildingWire } from "./cyber/Wireframes";
import { IconClock, IconPin, IconSpark, IconUser } from "./cyber/Icons";

export default function About() {
  const [lead, story, method, signoff] = about.paragraphs;
  return (
    <CyberSection id="about" label={about.eyebrow} wireframe={<BuildingWire />} labelledBy="about-title">
      <CyberTitle id="about-title">{about.heading}</CyberTitle>
      <p className="cyber-lead">{lead}</p>
      <SpecList
        items={[
          { icon: <IconUser />, label: "Founder", value: 'Pranav "Nav" Prakash' },
          { icon: <IconPin />, label: "Based", value: "New York & New Jersey" },
          { icon: <IconClock />, label: "Experience", value: "7+ years engineering campaigns for global brands" },
          { icon: <IconSpark />, label: "Method", value: "AI-assisted where it makes us faster. Human where it makes us better." },
        ]}
      />
      <p className="cyber-body">{story}</p>
      <p className="cyber-body">{method}</p>
      <p className="cyber-signoff">{signoff}</p>
      <div className="cyber-actions">
        <a href={`mailto:${contact.email}`} className="cyber-link">
          {contact.email}
        </a>
      </div>
    </CyberSection>
  );
}
