"use client";

import { motion } from "framer-motion";
import { AnimatedBeam } from "@/components/ui/animated-beam";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-[family-name:var(--font-mono-display)] text-3xl md:text-4xl text-foreground mb-4 uppercase tracking-tight">
            Jak to funguje
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tvá aplikace komunikuje přes MCP protokol s SÚKL daty
          </p>
        </motion.div>

        {/* Animated beam visualization */}
        <AnimatedBeam />

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
          <Step
            number={1}
            title="Zeptej se"
            description="Tvá AI aplikace pošle dotaz přes MCP protokol"
            color="pink"
            delay={0}
          />
          <Step
            number={2}
            title="MCP zpracuje"
            description="SÚKL MCP server vyhledá v databázi 68k léků"
            color="pixel-blue"
            delay={0.2}
          />
          <Step
            number={3}
            title="Dostaneš odpověď"
            description="Strukturovaná data v češtině zpět do tvé aplikace"
            color="teal"
            delay={0.4}
          />
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-pink/20 to-transparent" />
    </section>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
  color: "pink" | "pixel-blue" | "teal";
  delay: number;
}

function Step({ number, title, description, color, delay }: StepProps) {
  const colorClasses = {
    pink: "text-pink border-pink/30 bg-pink/5",
    "pixel-blue": "text-pixel-blue border-pixel-blue/30 bg-pixel-blue/5",
    teal: "text-teal border-teal/30 bg-teal/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div
        className={`w-12 h-12 rounded-xl border ${colorClasses[color]} flex items-center justify-center text-xl font-bold mx-auto mb-4`}
      >
        {number}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
