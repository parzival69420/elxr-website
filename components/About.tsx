import { about } from "@/lib/content";

export default function About() {
  const [lead, ...rest] = about.paragraphs;
  const signoff = rest.pop();
  return (
    <section id="about" className="about-section theme-split relative z-10">
      <span className="ghost-word" aria-hidden="true">
        Distillery
      </span>
      <div className="theme-wrap theme-two-col">
        <div>
          <h2 className="theme-display">{about.heading}</h2>
          <p className="about-lead">{lead}</p>
        </div>
        <div className="theme-tile about-copy">
          {rest.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="about-signoff">{signoff}</p>
        </div>
      </div>
    </section>
  );
}
