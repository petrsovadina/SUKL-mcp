"use client";

import { motion } from "framer-motion";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const REMAINING_TOOLS = [
  "check-availability",
  "find-pharmacies",
  "get-reimbursement",
  "get-pil-content",
  "get-spc-content",
  "batch-check-availability",
] as const;

interface TourCTAProps {
  onExplore: () => void;
}

export function TourCTA({ onExplore }: TourCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-4xl mb-4"
        aria-hidden="true"
      >
        🎉
      </motion.div>

      <h3 className="text-2xl md:text-3xl font-bold mb-2">
        Právě jste viděli 3 z 9 nástrojů
      </h3>
      <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
        SÚKL MCP nabízí ještě dalších 6 nástrojů pro vaše AI agenty
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {REMAINING_TOOLS.map((tool) => (
          <span
            key={tool}
            className="px-3 py-1 text-xs rounded-full border border-border bg-card/50 text-muted-foreground font-mono"
          >
            {tool}
          </span>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <ShimmerButton href="#quickstart" className="text-base px-8 py-3">
          Nainstalovat za 30 sekund
        </ShimmerButton>
        <button
          onClick={onExplore}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
        >
          Prozkoumat dál →
        </button>
      </div>
    </motion.div>
  );
}
