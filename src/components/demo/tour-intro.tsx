"use client";

import { motion } from "framer-motion";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const PREVIEW_STEPS = [
  { icon: "🔍", title: "Vyhledání léku", description: "Fuzzy search v 68 000+ přípravcích" },
  { icon: "💊", title: "Detail přípravku", description: "Kompletní karta jedním voláním" },
  { icon: "🏷️", title: "ATC skupina", description: "Klasifikace a alternativy" },
] as const;

interface TourIntroProps {
  onStart: () => void;
  onSkip: () => void;
}

export function TourIntro({ onStart, onSkip }: TourIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      <h3 className="text-2xl md:text-3xl font-bold mb-3">
        Podívejte se, jak SÚKL MCP funguje
      </h3>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        3 kroky, 60 sekund — reálná data z databáze SÚKL
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {PREVIEW_STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * (i + 1) }}
            className="border border-border rounded-xl p-4 bg-card/50"
          >
            <span className="text-2xl mb-2 block" aria-hidden="true">{step.icon}</span>
            <p className="font-semibold text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <ShimmerButton onClick={onStart} className="text-base px-8 py-3">
          Spustit demo
        </ShimmerButton>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Přeskočit a zkusit sám
        </button>
      </div>
    </motion.div>
  );
}
