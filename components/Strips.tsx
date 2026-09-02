import { strips } from "@/lib/content";

export default function Strips() {
  return (
    <section className="relative z-10 space-y-16 py-12">
      {/* category strip — scrolling marquee (second copy is decorative) */}
      <div className="overflow-hidden border-y border-white/5 py-5" aria-label="Sectors served">
        <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap text-sm font-medium tracking-wide text-text/60">
          {[false, true].map((decorative) => (
            <span
              key={String(decorative)}
              className="flex items-center gap-8"
              aria-hidden={decorative || undefined}
            >
              {strips.categories.map((c) => (
                <span key={c} className="flex items-center gap-8">
                  {c}
                  <span className="text-butter" aria-hidden="true">◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* numbers strip — glass tiles */}
      <div className="mx-auto grid w-[min(72rem,calc(100%-3rem))] grid-cols-2 gap-4 lg:grid-cols-4">
        {strips.numbers.map((n) => (
          <div key={n.value} className="glass flex flex-col gap-2 p-6 md:p-8">
            <span className="text-3xl font-black text-lavender md:text-5xl">
              {n.value}
            </span>
            <span className="text-sm text-text/65">{n.caption}</span>
          </div>
        ))}
      </div>

      {/* credentials strip */}
      <ul className="mx-auto flex w-[min(72rem,calc(100%-3rem))] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-[0.15em] text-butter/85">
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
