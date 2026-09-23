import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Thesis from "@/components/Thesis";
import Strips from "@/components/Strips";
import ServicesSection from "@/components/ServicesSection";
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
      <Nav />
      <Hero />
      <Thesis />
      <Strips />
      <ServicesSection />
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
