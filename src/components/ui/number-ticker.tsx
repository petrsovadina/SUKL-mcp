"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  direction = "up",
  className,
  delay = 0,
  decimalPlaces = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const springValue = useSpring(direction === "up" ? 0 : value, {
    bounce: 0,
    duration: 2000,
  });

  const displayValue = useTransform(springValue, (current) =>
    Intl.NumberFormat("cs-CZ", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(Math.floor(current))
  );

  useEffect(() => {
    if (isInView && isClient) {
      const timer = setTimeout(() => {
        springValue.set(direction === "up" ? value : 0);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, isClient, springValue, value, direction, delay]);

  if (!isClient) {
    return (
      <span ref={ref} className={cn("tabular-nums", className)}>
        {Intl.NumberFormat("cs-CZ").format(value)}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {displayValue}
    </motion.span>
  );
}
