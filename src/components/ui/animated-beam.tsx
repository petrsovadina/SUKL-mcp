"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { PillIcon, BoltIcon } from "@/components/icons";
import { Bot } from "lucide-react";

interface AnimatedBeamProps {
  className?: string;
}

export function AnimatedBeam({ className }: AnimatedBeamProps) {
  return (
    <div className={cn("relative w-full max-w-4xl mx-auto py-16", className)}>
      {/* Connection lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Line from App to MCP */}
        <motion.path
          d="M 150 100 L 400 100"
          stroke="url(#gradient1)"
          strokeWidth="2"
          strokeDasharray="8 8"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          viewport={{ once: true }}
        />
        {/* Line from MCP to SÚKL */}
        <motion.path
          d="M 400 100 L 650 100"
          stroke="url(#gradient2)"
          strokeWidth="2"
          strokeDasharray="8 8"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          viewport={{ once: true }}
        />
        
        {/* Animated particles */}
        <motion.circle
          r="4"
          fill="#E668A0"
          initial={{ cx: 150, cy: 100 }}
          animate={{ cx: [150, 400, 400], cy: [100, 100, 100] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
        <motion.circle
          r="4"
          fill="#4A90D9"
          initial={{ cx: 400, cy: 100 }}
          animate={{ cx: [400, 650, 650], cy: [100, 100, 100] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 1 }}
        />
        <motion.circle
          r="4"
          fill="#2EC4B6"
          initial={{ cx: 650, cy: 100 }}
          animate={{ cx: [650, 400, 150], cy: [100, 100, 100] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 2 }}
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E668A0" />
            <stop offset="100%" stopColor="#4A90D9" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A90D9" />
            <stop offset="100%" stopColor="#2EC4B6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Nodes */}
      <div className="relative flex justify-between items-center px-8">
        <BeamNode
          icon={<Bot className="w-8 h-8" />}
          label="Your App"
          color="pink"
          delay={0}
        />
        <BeamNode
          icon={<BoltIcon className="w-10 h-10" />}
          label="SÚKL MCP"
          color="pixel-blue"
          delay={0.3}
          isCenter
        />
        <BeamNode
          icon={<PillIcon className="w-8 h-8" />}
          label="SÚKL Data"
          color="teal"
          delay={0.6}
        />
      </div>
    </div>
  );
}

interface BeamNodeProps {
  icon: ReactNode;
  label: string;
  color: "pink" | "pixel-blue" | "teal";
  delay?: number;
  isCenter?: boolean;
}

function BeamNode({ icon, label, color, delay = 0, isCenter }: BeamNodeProps) {
  const colorClasses = {
    pink: "border-pink bg-pink/10 shadow-pink/20 text-pink",
    "pixel-blue": "border-pixel-blue bg-pixel-blue/10 shadow-pixel-blue/20 text-pixel-blue",
    teal: "border-teal bg-teal/10 shadow-teal/20 text-teal",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        className={cn(
          "w-20 h-20 rounded-2xl border-2 flex items-center justify-center",
          "shadow-lg backdrop-blur-sm",
          colorClasses[color],
          isCenter && "w-24 h-24"
        )}
        whileHover={{ scale: 1.1, rotate: 5 }}
        animate={isCenter ? { y: [0, -5, 0] } : undefined}
        transition={isCenter ? { duration: 2, repeat: Infinity } : undefined}
      >
        {icon}
      </motion.div>
      <span className={cn(
        "text-sm font-medium text-foreground",
        isCenter && "text-base text-foreground"
      )}>
        {label}
      </span>
    </motion.div>
  );
}
