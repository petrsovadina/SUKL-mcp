"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TypingAnimationProps {
  text: string;
  className?: string;
  cursorClassName?: string;
  duration?: number;
  delay?: number;
}

export function TypingAnimation({
  text,
  className,
  cursorClassName,
  duration = 50,
  delay = 0,
}: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const timeout = setTimeout(() => {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, duration);

      return () => clearInterval(typingInterval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [text, duration, delay, isClient]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  if (!isClient) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn("inline-flex", className)}>
      {displayText}
      <motion.span
        className={cn("ml-1", cursorClassName)}
        animate={{ opacity: showCursor ? 1 : 0 }}
      >
        |
      </motion.span>
    </span>
  );
}
