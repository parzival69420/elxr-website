import { about } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="relative z-10 mx-auto w-[min(56rem,calc(100%-3rem))] py-24 md:py-36">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-butter">
        {about.eyebrow}
      </p>
      <h2 className="mt-4 text-4xl font-black md:text-6xl">{about.heading}</h2>
      <div className="mt-10 space-y-6 text-lg leading-relaxed text-text/80 md:text-xl">
        {about.paragraphs.map((p, i) => (
          <p key={i} className={i === about.paragraphs.length - 1 ? "font-bold text-lavender" : ""}>
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
