import { manifesto } from "@/lib/content";
import BottleSVG from "./BottleSVG";

export default function Manifesto() {
  return (
    <section className="relative z-10 overflow-hidden py-32 md:py-48">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.13]">
        <BottleSVG id="manifesto" color="#7038E0" fill={0.8} className="h-[34rem] w-auto" />
      </div>
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight md:text-7xl">
          {manifesto.headline}
        </h2>
        <p className="mt-12 text-base font-medium text-text/75 md:text-lg">
          {manifesto.subline}
        </p>
      </div>
    </section>
  );
}
