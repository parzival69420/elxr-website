import { about, contact } from "@/lib/content";
import CyberSection, { CyberTitle } from "./cyber/CyberSection";
import FounderBadge from "./FounderBadge";

export default function About() {
  const [lead, story, method, signoff] = about.paragraphs;
  return (
    <CyberSection id="about" label={about.eyebrow} className="cyber-about" labelledBy="about-title">
      {/* Desktop: the copy on the left, the founder's pass hanging in the right column.
          Phones: the pass sits between the introduction and the story. */}
      <div className="about-layout">
        <div className="about-intro">
          <CyberTitle id="about-title">{about.heading}</CyberTitle>
          <p className="cyber-lead">{lead}</p>
        </div>
        <FounderBadge />
        <div className="about-story">
          <p className="cyber-body">{story}</p>
          <p className="cyber-body">{method}</p>
          <p className="cyber-signoff">{signoff}</p>
          <div className="cyber-actions">
            <a href={`mailto:${contact.email}`} className="cyber-link">
              {contact.email}
            </a>
          </div>
        </div>
      </div>
    </CyberSection>
  );
}
