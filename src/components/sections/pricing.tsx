"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { RegisterModal } from "@/components/forms/register-modal";
import { ContactModal } from "@/components/forms/contact-modal";
import { trackEvent } from "@/lib/analytics";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  action: "free" | "register" | "contact";
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "0 Kč",
    period: "navždy",
    description: "Pro osobní projekty a experimentování",
    features: [
      "9 MCP nástrojů",
      "100 požadavků / min",
      "Měsíční aktualizace dat",
      "Komunitní podpora",
      "Open source",
    ],
    cta: "Začít zdarma",
    action: "free",
  },
  {
    name: "Pro",
    price: "2 490 Kč",
    period: "/ měsíc",
    description: "Pro firmy a produkční nasazení",
    features: [
      "Vše z Free",
      "1 000 požadavků / min",
      "API klíč + dashboard",
      "Týdenní aktualizace dat",
      "Email podpora (48h)",
      "SLA 99,5% uptime",
    ],
    cta: "Získat API klíč",
    highlighted: true,
    badge: "Nejoblíbenější",
    action: "register",
  },
  {
    name: "Enterprise",
    price: "Na míru",
    period: "",
    description: "Pro nemocnice, řetězce a velké organizace",
    features: [
      "Vše z Pro",
      "Neomezené požadavky",
      "Denní aktualizace dat",
      "Webhooky pro monitoring",
      "Dedikovaná podpora (4h)",
      "SLA 99,9% + custom SLA",
    ],
    cta: "Kontaktujte nás",
    action: "contact",
  },
];

export function Pricing() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  function handleAction(action: PricingTier["action"]) {
    trackEvent("pricing_cta", { tier: action });
    switch (action) {
      case "free":
        document.getElementById("quickstart")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "register":
        setRegisterOpen(true);
        break;
      case "contact":
        setContactOpen(true);
        break;
    }
  }

  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-[family-name:var(--font-mono-display)] text-3xl md:text-4xl text-foreground mb-4 tracking-tight">
            Cenové plány
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Začněte zdarma, škálujte podle potřeby
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                tier.highlighted
                  ? "bg-card border-2 border-pink shadow-lg shadow-pink/10 scale-[1.02]"
                  : "bg-card border border-border"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink text-white text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {tier.action === "contact" ? (
                    <Building2 className="w-5 h-5 text-pixel-blue" />
                  ) : null}
                  <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-3xl font-bold ${tier.highlighted ? "text-pink" : "text-foreground"}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-muted-foreground text-sm">{tier.period}</span>
                  )}
                </div>

                <p className="text-muted-foreground text-sm">{tier.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.highlighted ? "text-pink" : "text-teal"}`} />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleAction(tier.action)}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  tier.highlighted
                    ? "bg-pink text-white hover:bg-pink/90"
                    : "border-2 border-border text-foreground hover:border-pink hover:bg-pink/5"
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Free tier je open source a zůstane zdarma navždy. Ceny bez DPH.
        </motion.p>
      </div>

      {/* Modals */}
      <RegisterModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)} />
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
