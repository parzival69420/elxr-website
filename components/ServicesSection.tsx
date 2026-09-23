import { servicesIntro } from "@/lib/content";
import BottleCarousel from "./BottleCarousel";

export default function ServicesSection() {
  return (
    <section id="services" className="services-section relative z-10">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{servicesIntro.eyebrow}</p>
          <h2>{servicesIntro.heading}</h2>
        </div>
        <p>{servicesIntro.subline}</p>
      </div>
      <BottleCarousel />
    </section>
  );
}
