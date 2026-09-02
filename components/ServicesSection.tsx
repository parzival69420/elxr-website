import { servicesIntro } from "@/lib/content";
import BottleCarousel from "./BottleCarousel";

export default function ServicesSection() {
  return (
    <section id="services" className="relative z-10 py-24 md:py-32">
      <span id="work" aria-hidden="true" />
      <div className="mx-auto mb-14 w-[min(72rem,calc(100%-3rem))] text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-butter">
          {servicesIntro.eyebrow}
        </p>
        <h2 className="mt-4 text-4xl font-black md:text-6xl">
          {servicesIntro.heading}
        </h2>
        <p className="mt-4 text-lg text-text/70">{servicesIntro.subline}</p>
      </div>
      <BottleCarousel />
    </section>
  );
}
