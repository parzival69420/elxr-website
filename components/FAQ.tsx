import { faq } from "@/lib/content";

export default function FAQ() {
  return (
    <section className="faq-section theme-split relative z-10">
      <span className="ghost-word" aria-hidden="true">
        FAQ
      </span>
      <div className="theme-wrap theme-two-col">
        <h2 className="theme-display">{faq.heading}</h2>
        <div>
          {faq.items.map((item) => (
            <details key={item.q} className="faq-item group">
              <summary>
                <span>{item.q}</span>
                <span
                  className="transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
