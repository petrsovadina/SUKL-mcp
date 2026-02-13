"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { HospitalIcon } from "@/components/icons";
import { Bot, Stethoscope, FlaskConical, X, Check } from "lucide-react";

const useCases = [
  {
    id: "chatbot",
    icon: <Bot className="w-6 h-6" />,
    iconLarge: <Bot className="w-10 h-10" />,
    title: "Chatbot o lécích",
    description:
      "Zákazník se zeptá: \"Můžu brát Paralen s alkoholem?\" — a chatbot má okamžitě správnou odpověď.",
    before: [
      "Ruční psaní odpovědí",
      "Zastaralé informace",
      "Nemožné pokrýt 68 000 léků",
    ],
    after: {
      code: "Načti příbalový leták → Paralen",
      result: "Chatbot najde sekci \"Alkohol\" v příbaláku a odpoví přesně a aktuálně",
    },
  },
  {
    id: "pharmacy",
    icon: <HospitalIcon className="w-6 h-6" />,
    iconLarge: <HospitalIcon className="w-10 h-10" />,
    title: "Lékárna",
    description:
      "Ranní kontrola: které léky na skladě mají výpadek dodávek nebo změnu ceny?",
    before: [
      "Volání distributorů",
      "Kontrola ručně na webu",
      "Excelovské tabulky",
    ],
    after: {
      code: "Zkontroluj dostupnost → [200 léků]",
      result: "Automatický přehled výpadků a cenových změn každé ráno v emailu",
    },
  },
  {
    id: "doctor",
    icon: <Stethoscope className="w-6 h-6" />,
    iconLarge: <Stethoscope className="w-10 h-10" />,
    title: "Asistent pro lékaře",
    description:
      "Pacient bere Warfarin. Lékař chce vědět, jestli nový lék nemá nebezpečnou interakci.",
    before: [
      "Hledání v papírovém SPC",
      "Časově náročné",
      "Riziko přehlédnutí",
    ],
    after: {
      code: "Porovnej SPC → Warfarin + nový lék",
      result: "AI najde sekce interakcí a upozorní na rizika během vteřiny",
    },
  },
  {
    id: "research",
    icon: <FlaskConical className="w-6 h-6" />,
    iconLarge: <FlaskConical className="w-10 h-10" />,
    title: "Výzkum",
    description:
      "Analýza trhu: kolik léků na srdce stojí méně než 100 Kč s doplatkem?",
    before: [
      "Ruční sběr z webu SÚKL",
      "Nekonzistentní formáty",
      "Týdny práce",
    ],
    after: {
      code: "Filtruj ATC skupinu C → cena < 100 Kč",
      result: "Kompletní dataset připravený pro analýzu během minut",
    },
  },
];

export function UseCases() {
  const [activeCase, setActiveCase] = useState(useCases[0].id);
  const currentCase = useCases.find((uc) => uc.id === activeCase)!;

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-[family-name:var(--font-mono-display)] text-3xl md:text-4xl text-foreground mb-4 tracking-tight">
            Kdo to používá
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Reálné problémy, které toto API řeší
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActiveCase(uc.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
                activeCase === uc.id
                  ? "bg-pink text-white shadow-lg"
                  : "bg-card border border-border text-foreground hover:border-pink hover:shadow-sm"
              )}
            >
              {uc.icon}
              <span className="text-sm font-medium hidden sm:inline">{uc.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={currentCase.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="text-pink">{currentCase.iconLarge}</div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {currentCase.title}
                </h3>
                <p className="text-muted-foreground">{currentCase.description}</p>
              </div>
            </div>

            {/* Before/After */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <X className="w-5 h-5 text-red-400" />
                  <span className="font-medium text-red-400">Bez SÚKL MCP</span>
                </div>
                <ul className="space-y-2">
                  {currentCase.before.map((item, i) => (
                    <li key={i} className="text-muted-foreground text-sm flex items-start gap-2">
                      <span className="text-red-400/50">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* After */}
              <div className="bg-teal/5 border border-teal/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5 text-teal" />
                  <span className="font-medium text-teal">S SÚKL MCP</span>
                </div>
                <div className="space-y-3">
                  <code className="block text-sm bg-muted rounded-lg px-3 py-2 text-pink font-[family-name:var(--font-jetbrains)]">
                    {currentCase.after.code}
                  </code>
                  <p className="text-foreground text-sm">
                    → {currentCase.after.result}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
