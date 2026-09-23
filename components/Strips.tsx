import { strips } from "@/lib/content";
import BentoCard from "@/components/BentoCard";
import SectorBanner from "@/components/SectorBanner";

export default function Strips() {
  return (
    <section className="relative z-10 space-y-16 py-12">
      {/* sectors: two crossing banners, looping */}
      <SectorBanner />

      {/* numbers strip — spec-sheet bento */}
      <div className="bento-grid mx-auto w-[var(--shell)]">
        {strips.numbers.map((n, i) => (
          <BentoCard
            key={n.value}
            index={i + 1}
            total={strips.numbers.length}
            tag={n.tag}
            value={n.value}
            caption={n.caption}
          />
        ))}
      </div>

      {/* credentials strip */}
      <ul className="mx-auto flex w-[var(--shell)] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-[0.15em] text-butter/85">
        {strips.credentials.map((c, i) => (
          <li key={c} className="flex items-center gap-8">
            {i > 0 && <span aria-hidden="true">◆</span>}
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
