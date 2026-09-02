import { faq } from "@/lib/content";

/** Native details/summary: keyboard-accessible and works with JS disabled. */
export default function FAQ() {
  return (
    <section className="relative z-10 mx-auto w-[min(48rem,calc(100%-3rem))] py-24">
      <h2 className="text-3xl font-black md:text-5xl">{faq.heading}</h2>
      <div className="mt-10 space-y-4">
        {faq.items.map((item) => (
          <details key={item.q} className="glass group px-6 py-5">
            <summary className="cursor-pointer list-none text-lg font-bold marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span
                  className="text-lavender transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-4 leading-relaxed text-text/75">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
