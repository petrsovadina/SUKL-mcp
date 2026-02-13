"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "./message-bubble";
import { ExampleChips } from "./example-chips";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: string;
  data?: Record<string, unknown>;
}

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "Nastala chyba při zpracování dotazu.",
          },
        ]);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: formatResponse(data),
        type: data.type,
        data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Nepodařilo se spojit se serverem. Zkuste to znovu.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="w-full max-w-2xl mx-auto border border-border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
      {/* Chat area */}
      <div ref={scrollRef} className="h-[400px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground text-sm mb-2">
              Zadejte název léku, SÚKL kód nebo ATC skupinu
            </p>
            <ExampleChips onSelect={(example) => sendMessage(example)} />
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hledat lék, ATC kód, lékárnu..."
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--sukl-blue,#2b6cb0)] focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-[var(--sukl-navy,#1a365d)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Odeslat
        </button>
      </form>
    </div>
  );
}

function formatResponse(data: Record<string, unknown>): string {
  switch (data.type) {
    case "search":
      return `Nalezeno ${data.total} výsledků`;
    case "detail":
      return data.medicine
        ? `Detail léku nalezen`
        : "Lék nebyl nalezen";
    case "pharmacy":
      return `Nalezeno ${data.total} lékáren`;
    case "atc":
      return data.info ? "ATC informace nalezeny" : "ATC kód nebyl nalezen";
    default:
      return "Výsledek zpracován";
  }
}
