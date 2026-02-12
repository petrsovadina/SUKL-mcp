"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { CodeBlock } from "@/components/ui/code-block";
import { TypingAnimation } from "@/components/ui/typing-animation";

const smitheryCode = `# Smithery (doporučeno)
npx @smithery/cli install @petrsovadina/SUKL-mcp`;

const claudeConfigCode = `{
  "mcpServers": {
    "sukl": {
      "command": "npx",
      "args": ["@petrsovadina/sukl-mcp"]
    }
  }
}`;

export function QuickStart() {
  return (
    <section id="quickstart" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-[family-name:var(--font-mono-display)] text-3xl md:text-4xl text-foreground mb-4 uppercase tracking-tight">
            Rychlý start
          </h2>
          <p className="text-muted-foreground text-lg">
            Za{" "}
            <span className="text-pink font-bold">30 sekund</span>{" "}
            máš přístup k 68k českých léků
          </p>
        </motion.div>

        {/* Code blocks */}
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Smithery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-teal text-sm font-medium">
                Smithery (doporučeno)
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-teal/20 text-teal">
                Nejrychlejší
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-[#1e1e2e] border border-border p-4">
              <TypingAnimation
                text="npx @smithery/cli install @petrsovadina/SUKL-mcp"
                className="font-[family-name:var(--font-jetbrains)] text-teal"
                delay={1}
              />
            </div>
          </motion.div>

          {/* Claude Desktop config */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-pixel-blue text-sm font-medium">
                Claude Desktop config
              </span>
              <span className="text-xs text-muted-foreground">
                ~/.claude/claude_desktop_config.json
              </span>
            </div>
            <CodeBlock code={claudeConfigCode} language="json" />
          </motion.div>

          {/* Success message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center pt-6"
          >
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal" />
              Hotovo. Teď se zeptej Claudea:
            </p>
            <p className="text-lg text-foreground mt-2 italic">
              &ldquo;Jaké jsou vedlejší účinky Ibalginu?&rdquo;
            </p>
          </motion.div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-pixel-blue/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
