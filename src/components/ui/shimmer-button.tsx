"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  onClick?: () => void;
  href?: string;
}

export function ShimmerButton({
  children,
  className,
  shimmerColor = "#2b6cb0",
  shimmerSize = "0.1em",
  borderRadius = "0.5rem",
  shimmerDuration = "2s",
  background = "#1a365d",
  onClick,
  href,
}: ShimmerButtonProps) {
  const Component = href ? motion.a : motion.button;
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white font-semibold",
        "[background:var(--bg)] [border-radius:var(--radius)]",
        "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-[1px]",
        className
      )}
      style={
        {
          "--bg": background,
          "--radius": borderRadius,
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--speed": shimmerDuration,
        } as React.CSSProperties
      }
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shimmer effect */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden",
          "[border-radius:var(--radius)]"
        )}
      >
        <div
          className="absolute inset-[-100%] animate-[shimmer_2s_infinite]"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}30, transparent)`,
          }}
        />
      </div>

      {/* Border */}
      <div
        className={cn(
          "absolute inset-0 [border-radius:var(--radius)]",
          "border-2 border-border group-hover:border-[var(--shimmer-color)]",
          "transition-colors duration-300"
        )}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Component>
  );
}
