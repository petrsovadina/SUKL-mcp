"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MovingBorderProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  borderRadius?: string;
  duration?: number;
  borderClassName?: string;
  as?: React.ElementType;
  href?: string;
}

export function MovingBorder({
  children,
  className,
  containerClassName,
  borderRadius = "1rem",
  duration = 2000,
  borderClassName,
  as: Component = "button",
  href,
}: MovingBorderProps) {
  const MotionComponent = motion(Component as any);

  return (
    <MotionComponent
      href={href}
      className={cn(
        "relative overflow-hidden bg-transparent p-[1px]",
        containerClassName
      )}
      style={{ borderRadius }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated border */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-[conic-gradient(from_var(--angle),#E668A0,#4A90D9,#2EC4B6,#E668A0)]",
          borderClassName
        )}
        style={
          {
            "--angle": "0deg",
            animation: `spin ${duration}ms linear infinite`,
            borderRadius,
          } as React.CSSProperties
        }
      />

      {/* Inner content */}
      <div
        className={cn(
          "relative bg-[#0a0a0f] px-6 py-3",
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} - 1px)` }}
      >
        {children}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            --angle: 0deg;
          }
          to {
            --angle: 360deg;
          }
        }
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
    </MotionComponent>
  );
}
