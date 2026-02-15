"use client";

import dynamic from "next/dynamic";

const GuidedTour = dynamic(
  () => import("@/components/demo/guided-tour").then((m) => m.GuidedTour),
  { ssr: false }
);

export function DemoSection() {
  return (
    <section id="demo" className="py-24" aria-label="Interaktivní demo">
      <div className="container mx-auto px-4">
        <GuidedTour />
      </div>
    </section>
  );
}
