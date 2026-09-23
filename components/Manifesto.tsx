import { manifesto } from "@/lib/content";

export default function Manifesto() {
  return (
    <section className="manifesto-section theme-split relative z-10 overflow-hidden">
      <span className="theme-ring manifesto-ring" aria-hidden="true" />
      <div className="theme-wrap manifesto-inner">
        <h2 className="theme-display">{manifesto.headline}</h2>
        <p>{manifesto.subline}</p>
      </div>
    </section>
  );
}
