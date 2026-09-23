import Nav from "@/components/Nav";
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

export default function Home() {
  return (
    <main>
      {/* Set before first paint: the page opens on the bare map (Hero clears the flag once the city has risen),
          and `js` lets the bottle scenes pin; without it they stay stacked, readable panels. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.documentElement.dataset.cityLoading='';document.documentElement.classList.add('js');",
        }}
      />
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
