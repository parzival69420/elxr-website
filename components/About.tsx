import { about } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="about-section relative z-10">
      <div>
        <p className="section-kicker">{about.eyebrow}</p>
        <h2>{about.heading}</h2>
      </div>
      <div className="about-copy">
        {about.paragraphs.map((p, i) => (
          <p
            key={i}
            className={i === about.paragraphs.length - 1 ? "about-signoff" : ""}
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
