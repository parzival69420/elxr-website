import { bottles } from "@/lib/content";
import BottleSVG from "./BottleSVG";

/**
 * Full service content, statically in the DOM (accessibility floor:
 * every bottle readable with JavaScript disabled).
 */
export default function ServiceDetails() {
  return (
    <section className="relative z-10 mx-auto w-[min(72rem,calc(100%-3rem))] space-y-8 py-16">
      {bottles.map((b, idx) => (
        <article
          key={b.id}
          id={`detail-${b.id}`}
          className="glass grid gap-8 p-8 md:grid-cols-[auto_1fr] md:p-12"
        >
          <div className="flex flex-col items-center gap-3 md:w-40">
            <BottleSVG
              id={`detail-${b.id}`}
              color={b.liquidColor}
              fill={0.72}
              className="h-40 w-auto"
            />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-text/40">
              Bottle {idx + 1}
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black md:text-3xl">{b.name}</h3>
            <p className="mt-1 font-bold text-lavender">{b.tagline}</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-text/80">{b.oneLiner}</p>
            {b.bodyCopy?.map((p, i) => (
              <p key={i} className="mt-3 max-w-2xl leading-relaxed text-text/80">
                {p}
              </p>
            ))}
            <h4 className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-butter">
              What&apos;s inside
            </h4>
            <ul className="mt-3 flex max-w-2xl flex-wrap gap-2">
              {b.whatsInside.map((w) => (
                <li
                  key={w}
                  className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-text/80"
                >
                  {w}
                </li>
              ))}
            </ul>
            {b.proof.length > 0 && (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {b.proof.map((p, i) => (
                  <blockquote key={i} className="border-l-2 border-purple pl-5">
                    <p className="text-sm leading-relaxed text-text/75">{p.body}</p>
                    <p className="mt-3 text-sm font-bold text-lavender">{p.stat}</p>
                  </blockquote>
                ))}
              </div>
            )}
            <a
              href={b.cta.href}
              className="mt-8 inline-block font-bold text-lavender underline-offset-4 hover:underline"
            >
              {b.cta.label}
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
