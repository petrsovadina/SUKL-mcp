"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TourProgress } from "./tour-progress";
import { TourValueCard } from "./tour-value-card";
import { ChatWidget } from "./chat-widget";

interface StepConfig {
  index: number;
  scenario: { icon: string; text: string };
  suggestedQuery: string;
  valueCard: {
    icon: string;
    title: string;
    descriptionTemplate: string;
    statTemplate: string;
  };
}

interface TourStepProps {
  step: StepConfig;
  onContinue: (responseData: Record<string, unknown>) => void;
  onSkip: () => void;
}

export function TourStep({ step, onContinue, onSkip }: TourStepProps) {
  const [responseData, setResponseData] = useState<Record<string, unknown> | null>(null);

  const handleResponse = useCallback((data: Record<string, unknown>) => {
    setResponseData(data);
  }, []);

  function buildValueStat(data: Record<string, unknown>): string {
    const template = step.valueCard.statTemplate;
    const timeMs = data.time_ms ?? "< 50";

    if (data.type === "search") {
      return template
        .replace("{count}", String(data.total ?? 0))
        .replace("{time}", String(timeMs));
    }
    if (data.type === "atc") {
      return template
        .replace("{total}", String(data.medicines_total ?? 0));
    }
    return template.replace("{time}", String(timeMs));
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* Progress bar */}
      <TourProgress currentStep={step.index} />

      {/* Scenario context */}
      <div className="border border-border rounded-lg p-3 bg-card/50 flex items-start gap-3">
        <span className="text-lg flex-shrink-0" aria-hidden="true">{step.scenario.icon}</span>
        <p className="text-sm text-muted-foreground italic">{step.scenario.text}</p>
      </div>

      {/* Chat widget in guided mode */}
      <ChatWidget
        mode="guided"
        suggestedQuery={step.suggestedQuery}
        onResponse={handleResponse}
      />

      {/* Value card — shown after response */}
      <AnimatePresence>
        {responseData ? (
          <TourValueCard
            icon={step.valueCard.icon}
            title={step.valueCard.title}
            description={step.valueCard.descriptionTemplate}
            stat={buildValueStat(responseData)}
          />
        ) : null}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Přeskočit prohlídku
        </button>
        {responseData ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onContinue(responseData)}
            className="px-5 py-2 bg-[var(--sukl-navy,#1a365d)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Pokračovat →
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
}
