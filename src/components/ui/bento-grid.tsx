"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BentoGridProps {
  className?: string;
  children: ReactNode;
}

export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  className?: string;
  icon: ReactNode;
  title: string;
  description: string;
  gradient?: string;
  index?: number;
}

export function BentoCard({
  className,
  icon,
  title,
  description,
  gradient = "from-pink/10 to-transparent",
  index = 0,
}: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "group relative overflow-hidden rounded-xl",
        "bg-card border border-border shadow-sm",
        "p-6 transition-all duration-300",
        "hover:border-pink/50 hover:shadow-lg hover:shadow-pink/10",
        className
      )}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-br ${gradient}`
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="text-3xl mb-4 text-pink">{icon}</div>
        <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-pink transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-20 transition-opacity">
        <div className="absolute top-2 right-2 w-2 h-2 bg-pink rounded-sm" />
        <div className="absolute top-2 right-6 w-2 h-2 bg-pixel-blue rounded-sm" />
        <div className="absolute top-6 right-2 w-2 h-2 bg-teal rounded-sm" />
      </div>
    </motion.div>
  );
}
