"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-[#1e1e2e] border border-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {filename && (
            <span className="ml-3 text-xs text-gray-400 font-mono">
              {filename}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="p-4 overflow-x-auto">
        <code className="font-[family-name:var(--font-jetbrains)] text-sm text-gray-200">
          {code.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-gray-500 w-8 text-right pr-4">
                {i + 1}
              </span>
              <span>
                {highlightSyntax(line, language)}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </motion.div>
  );
}

function highlightSyntax(line: string, language: string) {
  if (language === "bash") {
    // Highlight commands
    if (line.startsWith("npx") || line.startsWith("npm")) {
      return <span className="text-emerald-400">{line}</span>;
    }
    if (line.startsWith("#")) {
      return <span className="text-gray-500">{line}</span>;
    }
  }
  
  if (language === "json") {
    // Simple JSON highlighting - light colors for dark background
    return line
      .replace(/"([^"]+)":/g, '<key>"$1"</key>:')
      .replace(/"([^"]+)"/g, '<string>"$1"</string>')
      .split(/(<\/?(?:key|string)>)/g)
      .map((part, i) => {
        if (part === '<key>') return null;
        if (part === '</key>') return null;
        if (part === '<string>') return null;
        if (part === '</string>') return null;
        if (part.includes('"') && line.indexOf(part) < line.indexOf(':')) {
          // Keys - light blue
          return <span key={i} className="text-sky-400">{part}</span>;
        }
        if (part.includes('"')) {
          // String values - orange/peach
          return <span key={i} className="text-orange-300">{part}</span>;
        }
        return part;
      });
  }
  
  return line;
}
