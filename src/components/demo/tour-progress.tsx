"use client";

import { motion } from "framer-motion";

const STEPS = [
  { label: "Vyhledání", color: "var(--sukl-navy, #1a365d)" },
  { label: "Detail", color: "var(--sukl-blue, #2b6cb0)" },
  { label: "ATC skupina", color: "var(--sukl-light-blue, #63b3ed)" },
] as const;

interface TourProgressProps {
  currentStep: number; // 0-indexed
}

export function TourProgress({ currentStep }: TourProgressProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-md mx-auto" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={3}>
      {STEPS.map((step, i) => {
        const isComplete = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={step.label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: step.color }}
                initial={{ width: "0%" }}
                animate={{ width: isComplete ? "100%" : isActive ? "50%" : "0%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                layoutId={`progress-bar-${i}`}
              />
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                isActive
                  ? "text-foreground"
                  : isComplete
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
