import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Projects from "@/components/Projects";
import Benefits from "@/components/Benefits";
import Faq from "@/components/Faq";
import ProcessTimeline from "@/components/ProcessTimeline";
import FinalCta from "@/components/FinalCta";
import StoreMiniHero from "@/components/StoreMiniHero";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Hero />
      <StoreMiniHero />
      <Services />
      <Projects />
      <Benefits />
      <Faq />
      <ProcessTimeline />
      <FinalCta />
    </>
  );
}
