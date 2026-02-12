"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Odkud pocházejí data?",
    answer:
      "Přímo z oficiálního registru SÚKL (Státní ústav pro kontrolu léčiv). Jsou to stejná data, která používají lékárny a nemocnice. Aktualizujeme je pravidelně.",
  },
  {
    question: "Je to legální a bezpečné?",
    answer:
      "Ano. SÚKL poskytuje tato data jako veřejná Open Data. Žádný scraping, žádné porušení podmínek. Pro lékařská rozhodnutí vždy doporučujeme konzultaci s odborníkem.",
  },
  {
    question: "Můžu to použít komerčně?",
    answer:
      "Ano. Licence MIT umožňuje jakékoliv použití — startup, enterprise, komerční produkt. Zdarma a bez omezení.",
  },
  {
    question: "Jak to integruji do své aplikace?",
    answer:
      "Máš dvě možnosti: REST API pro tradiční webové aplikace, nebo MCP protokol pro AI nástroje jako Claude nebo Cursor. Dokumentace je na GitHubu.",
  },
  {
    question: "Kolik to stojí?",
    answer:
      "Nic. Je to open source a zdarma. Můžeš použít náš veřejný server, nebo si spustit vlastní bez jakýchkoliv poplatků.",
  },
  {
    question: "Našel jsem chybu nebo mi něco chybí.",
    answer:
      "Napiš nám na GitHub. Rádi opravíme chyby a přidáme nové funkce. Komunita je vítána.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-[family-name:var(--font-mono-display)] text-3xl md:text-4xl text-foreground mb-4 uppercase tracking-tight">
            Časté dotazy
          </h2>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-pink/50"
              >
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
