import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/Hero";
import Thesis from "@/components/Thesis";
import Strips from "@/components/Strips";
import BottleScenes from "@/components/BottleScenes";
import ServiceDetails from "@/components/ServiceDetails";
import Work from "@/components/Work";
import Manifesto from "@/components/Manifesto";
import About from "@/components/About";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const cityModels = [
  "architecture-kit",
  "street-kit",
  "one-times-square",
  "empire-state",
  "one-world-trade",
  "one-vanderbilt",
  "hudson-yards-edge",
];

export default function Home() {
  return (
    <main>
      {/* The hero city's models start downloading with the page, not after the 3D code loads. */}
      {cityModels.map((file) => (
        <link key={file} rel="preload" href={`/models/city/${file}.glb`} as="fetch" crossOrigin="anonymous" />
      ))}
      {/* Set before first paint: the page opens on the bare map (Hero clears the flag once the city has risen),
          and `js` lets the bottle scenes pin; without it they stay stacked, readable panels. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.documentElement.dataset.cityLoading='';document.documentElement.classList.add('js');",
        }}
      />
      <SmoothScroll />
      <Nav />
      <Hero />
      <Thesis />
      <Strips />
      <BottleScenes />
      <ServiceDetails />
      <Work />
      <Manifesto />
      <About />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  );
}
