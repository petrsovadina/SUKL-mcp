"use client";

import { motion } from "framer-motion";

interface TourValueCardProps {
  icon: string;
  title: string;
  description: string;
  stat?: string;
}

export function TourValueCard({ icon, title, description, stat }: TourValueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
      className="border border-[var(--sukl-blue,#2b6cb0)]/30 bg-[var(--sukl-blue,#2b6cb0)]/5 rounded-lg p-4 mt-3"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          {stat ? (
            <p className="text-xs font-mono text-[var(--sukl-blue,#2b6cb0)] mt-1.5">{stat}</p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
