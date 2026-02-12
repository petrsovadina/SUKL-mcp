"use client";

import { ChatWidget } from "@/components/demo/chat-widget";

export function DemoSection() {
  return (
    <section id="demo" className="py-24" aria-label="Interaktivní demo">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vyzkoušejte si to
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Zadejte název léku a okamžitě uvidíte, co MCP server vrací AI
            agentům. Žádný LLM — přímý přístup k datům SÚKL.
          </p>
        </div>
        <ChatWidget />
      </div>
    </section>
  );
}
