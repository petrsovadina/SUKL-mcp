"use client";

import { useReducer } from "react";
import { AnimatePresence } from "framer-motion";
import { TourIntro } from "./tour-intro";
import { TourStep } from "./tour-step";
import { TourCTA } from "./tour-cta";
import { ChatWidget } from "./chat-widget";

// --- Step configurations ---

const FALLBACK_CODE = "0027561";
const FALLBACK_ATC = "M01AE";

interface StepDef {
  scenario: { icon: string; text: string };
  valueCard: {
    icon: string;
    title: string;
    descriptionTemplate: string;
    statTemplate: string;
  };
}

const STEP_DEFS: StepDef[] = [
  {
    scenario: {
      icon: "🤒",
      text: "Pacient se ptá na lék proti bolesti. Váš AI agent potřebuje najít dostupné přípravky...",
    },
    valueCard: {
      icon: "🔍",
      title: "Fuzzy vyhledávání",
      descriptionTemplate: "Prohledává 68 000+ léčivých přípravků v databázi SÚKL",
      statTemplate: "{count} výsledků za {time}ms",
    },
  },
  {
    scenario: {
      icon: "📋",
      text: "Pacient chce vědět víc o konkrétním léku. Potřebujete kompletní informace...",
    },
    valueCard: {
      icon: "💊",
      title: "Kompletní karta přípravku",
      descriptionTemplate: "Všechny informace o léku jedním API voláním",
      statTemplate: "1 volání, kompletní data za {time}ms",
    },
  },
  {
    scenario: {
      icon: "🔄",
      text: "Lék není dostupný? Najděte alternativy ve stejné ATC skupině...",
    },
    valueCard: {
      icon: "🏷️",
      title: "ATC hierarchie",
      descriptionTemplate: "Klasifikace léčiv a vyhledání alternativ",
      statTemplate: "{total} léků ve skupině",
    },
  },
];

// --- State machine ---

type Phase = "intro" | "step-1" | "step-2" | "step-3" | "complete" | "free";

interface TourState {
  phase: Phase;
  suklCode: string;
  atcCode: string;
}

type TourAction =
  | { type: "START" }
  | { type: "SKIP" }
  | { type: "COMPLETE_STEP"; step: 1 | 2 | 3; data: Record<string, unknown> }
  | { type: "EXPLORE" }
  | { type: "RESTART" };

function extractSuklCode(data: Record<string, unknown>): string {
  if (data.type === "search") {
    const results = data.results as Array<Record<string, string | null>> | undefined;
    return results?.[0]?.sukl_code ?? FALLBACK_CODE;
  }
  return FALLBACK_CODE;
}

function extractAtcCode(data: Record<string, unknown>): string {
  if (data.type === "detail") {
    const med = data.medicine as Record<string, string | null> | undefined;
    return med?.atc_code ?? FALLBACK_ATC;
  }
  return FALLBACK_ATC;
}

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case "START":
      return { ...state, phase: "step-1" };

    case "SKIP": {
      markTourDone("skipped");
      return { ...state, phase: "free" };
    }

    case "COMPLETE_STEP": {
      if (action.step === 1) {
        const code = extractSuklCode(action.data);
        return { ...state, phase: "step-2", suklCode: code };
      }
      if (action.step === 2) {
        const atc = extractAtcCode(action.data);
        return { ...state, phase: "step-3", atcCode: atc };
      }
      // step 3
      markTourDone("complete");
      return { ...state, phase: "complete" };
    }

    case "EXPLORE":
      return { ...state, phase: "free" };

    case "RESTART":
      return { phase: "intro", suklCode: FALLBACK_CODE, atcCode: FALLBACK_ATC };

    default:
      return state;
  }
}

function isTourDone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("sukl-tour-complete") !== null ||
      localStorage.getItem("sukl-tour-skipped") !== null;
  } catch {
    return false;
  }
}

function markTourDone(reason: "complete" | "skipped") {
  try {
    localStorage.setItem(
      reason === "complete" ? "sukl-tour-complete" : "sukl-tour-skipped",
      new Date().toISOString()
    );
  } catch {
    // localStorage unavailable
  }
}

// --- Component ---

export function GuidedTour() {
  const [state, dispatch] = useReducer(tourReducer, undefined, () => ({
    phase: (isTourDone() ? "free" : "intro") as Phase,
    suklCode: FALLBACK_CODE,
    atcCode: FALLBACK_ATC,
  }));

  const handleSkip = () => dispatch({ type: "SKIP" });

  function getStepQuery(stepIndex: number): string {
    if (stepIndex === 0) return "Ibalgin";
    if (stepIndex === 1) return state.suklCode;
    return `ATC ${state.atcCode}`;
  }

  function renderPhase() {
    switch (state.phase) {
      case "intro":
        return (
          <TourIntro
            key="intro"
            onStart={() => dispatch({ type: "START" })}
            onSkip={handleSkip}
          />
        );

      case "step-1":
      case "step-2":
      case "step-3": {
        const stepNum = parseInt(state.phase.split("-")[1]) as 1 | 2 | 3;
        const stepIndex = stepNum - 1;
        return (
          <TourStep
            key={state.phase}
            step={{
              index: stepIndex,
              scenario: STEP_DEFS[stepIndex].scenario,
              suggestedQuery: getStepQuery(stepIndex),
              valueCard: STEP_DEFS[stepIndex].valueCard,
            }}
            onContinue={(data) =>
              dispatch({ type: "COMPLETE_STEP", step: stepNum, data })
            }
            onSkip={handleSkip}
          />
        );
      }

      case "complete":
        return (
          <TourCTA
            key="cta"
            onExplore={() => dispatch({ type: "EXPLORE" })}
          />
        );

      case "free":
        return (
          <div key="free" className="w-full">
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Vyzkoušejte si to
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
                Zadejte název léku a okamžitě uvidíte, co MCP server vrací AI agentům.
                {" "}
                <button
                  onClick={() => dispatch({ type: "RESTART" })}
                  className="text-[var(--sukl-blue,#2b6cb0)] hover:underline"
                >
                  Spustit prohlídku znovu
                </button>
              </p>
            </div>
            <ChatWidget mode="free" />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <AnimatePresence mode="wait">
      {renderPhase()}
    </AnimatePresence>
  );
}
