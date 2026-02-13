"use client";

import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { QuickStart } from "@/components/sections/quickstart";
import { Tools } from "@/components/sections/tools";
import { HowItWorks } from "@/components/sections/how-it-works";
import { UseCases } from "@/components/sections/use-cases";
import { Stats } from "@/components/sections/stats";
import { Why } from "@/components/sections/why";
import { FAQ } from "@/components/sections/faq";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";
import { DemoSection } from "@/components/sections/demo-section";
import { Spotlight } from "@/components/ui/spotlight";
import { Particles } from "@/components/ui/particles";

export default function Home() {
  return (
    <>
      {/* Skip link for keyboard navigation - WCAG 2.4.1 */}
      <a href="#main-content" className="skip-link">
        Přeskočit na hlavní obsah
      </a>

      {/* Background effects */}
      <Particles quantity={30} aria-hidden="true" />
      <Spotlight />

      {/* Header */}
      <Header />

      {/* Main content */}
      <main id="main-content" role="main" aria-label="Hlavní obsah">
        <Hero />
        <QuickStart />
        <Tools />
        <HowItWorks />
        <DemoSection />
        <UseCases />
        <Stats />
        <Why />
        <FAQ />
        <CTA />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
