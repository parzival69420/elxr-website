import { manifesto } from "@/lib/content";

export default function Manifesto() {
  return (
    <section className="manifesto-section relative z-10 overflow-hidden">
      <span className="manifesto-symbol" aria-hidden="true">
        ✳
      </span>
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <h2>{manifesto.headline}</h2>
        <p>{manifesto.subline}</p>
      </div>
    </section>
  );
}
