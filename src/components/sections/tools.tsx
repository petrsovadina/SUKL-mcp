"use client";

import { motion } from "framer-motion";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  SearchIcon,
  PillIcon,
  FileTextIcon,
  DollarIcon,
  HospitalIcon,
  LayersIcon,
  DatabaseIcon,
  MapPinIcon,
} from "@/components/icons";
import { Check, Package } from "lucide-react";

const tools = [
  {
    icon: <SearchIcon className="w-6 h-6" />,
    title: "Vyhledávání léků",
    description: "Najdi lék podle názvu, účinné látky nebo SÚKL kódu. Podporuje i překlepy.",
    gradient: "from-pink/10 to-transparent",
  },
  {
    icon: <PillIcon className="w-6 h-6" />,
    title: "Detail léku",
    description: "Kompletní info: dávkování, forma, výrobce, registrace, balení.",
    gradient: "from-pixel-blue/10 to-transparent",
  },
  {
    icon: <FileTextIcon className="w-6 h-6" />,
    title: "Příbalový leták",
    description: "Celý text příbalového letáku v češtině. Pro pacienty srozumitelný.",
    gradient: "from-teal/10 to-transparent",
  },
  {
    icon: <DatabaseIcon className="w-6 h-6" />,
    title: "SPC pro lékaře",
    description: "Souhrn údajů o přípravku — odborné info pro zdravotníky.",
    gradient: "from-pink/10 to-transparent",
  },
  {
    icon: <DollarIcon className="w-6 h-6" />,
    title: "Ceny a úhrady",
    description: "Maximální cena, doplatek pacienta, úhrada pojišťovny.",
    gradient: "from-pixel-blue/10 to-transparent",
  },
  {
    icon: <Check className="w-6 h-6" />,
    title: "Dostupnost léku",
    description: "Je lék na trhu? Má výpadek? Existuje alternativa?",
    gradient: "from-teal/10 to-transparent",
  },
  {
    icon: <MapPinIcon className="w-6 h-6" />,
    title: "Lékárny v ČR",
    description: "2 674 lékáren s adresou, telefonem a otevírací dobou.",
    gradient: "from-pink/10 to-transparent",
  },
  {
    icon: <LayersIcon className="w-6 h-6" />,
    title: "ATC klasifikace",
    description: "Zařazení léku podle anatomicko-terapeutického systému WHO.",
    gradient: "from-pixel-blue/10 to-transparent",
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: "Hromadné dotazy",
    description: "Kontrola 100 léků najednou. Pro nemocniční a lékárenské systémy.",
    gradient: "from-teal/10 to-transparent",
  },
];

export function Tools() {
  return (
    <section id="tools" className="py-24 relative">
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
            Co všechno umí
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            9 funkcí které pokrývají všechno, co potřebuješ vědět o lécích v ČR
          </p>
        </motion.div>

        {/* Tools grid */}
        <BentoGrid className="max-w-5xl mx-auto">
          {tools.map((tool, index) => (
            <BentoCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              gradient={tool.gradient}
              index={index}
            />
          ))}
        </BentoGrid>
      </div>

      {/* Background decoration */}
      <div className="absolute right-0 top-1/3 w-96 h-96 bg-pink/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
