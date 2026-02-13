"use client";

import { motion } from "framer-motion";
import {
  TrophyIcon,
  BuildingIcon,
  FlagCzIcon,
  BoltIcon,
  UnlockIcon,
} from "@/components/icons";

const reasons = [
  {
    icon: <TrophyIcon className="w-8 h-8" />,
    title: "Jediné API pro české léky",
    description: "Kompletní databáze SÚKL na jednom místě. Nemusíš stahovat CSV, parsovat HTML nebo scrapovat.",
    color: "pink",
  },
  {
    icon: <BuildingIcon className="w-8 h-8" />,
    title: "Oficiální data ze SÚKL",
    description: "Státní data z veřejného registru. Legální, aktuální, spolehlivá. Žádné právní riziko.",
    color: "pixel-blue",
  },
  {
    icon: <FlagCzIcon className="w-8 h-8" />,
    title: "Vše v češtině",
    description: "Příbalové letáky, názvy léků, popisky — vše česky pro české pacienty a lékaře.",
    color: "teal",
  },
  {
    icon: <BoltIcon className="w-8 h-8" />,
    title: "Začneš za 5 minut",
    description: "Jednoduchá integrace. REST API, nebo MCP protokol pro AI nástroje. Bez registrace.",
    color: "pink",
  },
  {
    icon: <UnlockIcon className="w-8 h-8" />,
    title: "Open Source a zdarma",
    description: "MIT licence. Zdrojový kód na GitHubu. Použij komerčně, uprav si, nebo přispěj.",
    color: "pixel-blue",
  },
];

export function Why() {
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
            Proč to používat
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ušetři si týdny práce s daty a soustřeď se na svůj produkt
          </p>
        </motion.div>

        {/* Reasons */}
        <div className="max-w-3xl mx-auto space-y-4">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className={`flex items-start gap-4 p-6 rounded-xl bg-card border border-border hover:border-${reason.color}/50 transition-colors`}
            >
              <div className={`text-${reason.color}`}>{reason.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground">{reason.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
