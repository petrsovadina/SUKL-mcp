"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
}: TextGenerateEffectProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const wordsArray = words.split(" ");

  return (
    <div ref={ref} className={cn("font-bold", className)}>
      <motion.div className="inline">
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="inline-block"
            initial={{
              opacity: 0,
              filter: filter ? "blur(10px)" : "none",
            }}
            animate={isInView ? {
              opacity: 1,
              filter: "blur(0px)",
            } : {}}
            transition={{
              duration,
              delay: idx * 0.1,
              ease: "easeOut",
            }}
          >
            {word}
            {idx < wordsArray.length - 1 && "\u00A0"}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
