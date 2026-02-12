"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Star, Check, Rocket } from "lucide-react";
import Link from "next/link";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { MovingBorder } from "@/components/ui/moving-border";

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="font-[family-name:var(--font-mono-display)] text-4xl md:text-5xl text-foreground mb-6 tracking-tight"
        >
          Začni používat data o lécích ještě dnes
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto"
        >
          Celá databáze SÚKL. Bez registrace, bez platby.{" "}
          <span className="text-pink font-bold">Open source a zdarma navždy.</span>
        </motion.p>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-teal" /> 68,248 léků</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-teal" /> Aktualizováno denně</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-teal" /> Open Source MIT</span>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <ShimmerButton
            href="https://smithery.ai/server/@petrsovadina/sukl-mcp"
            className="text-base"
            shimmerColor="#2b6cb0"
          >
            <Rocket className="w-4 h-4" /> Nainstalovat zdarma
            <ArrowRight className="w-4 h-4" />
          </ShimmerButton>

          <Link
            href="https://github.com/petrsovadina/SUKL-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-border hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all group text-foreground font-medium"
          >
            <Star className="w-4 h-4 text-yellow-400 group-hover:fill-yellow-400 transition-all" />
            <span>Podpořit na GitHubu</span>
          </Link>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-pink/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
