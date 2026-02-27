"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle } from "lucide-react";

const USE_CASES = [
  "Chatbot",
  "Lékárna",
  "Klinický systém",
  "Výzkum",
  "Jiné",
];

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState(USE_CASES[0]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company, useCase }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Něco se pokazilo.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Nepodařilo se odeslat. Zkuste to znovu.");
      setStatus("error");
    }
  }

  function handleClose() {
    setStatus("idle");
    setEmail("");
    setCompany("");
    setUseCase(USE_CASES[0]);
    setErrorMsg("");
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Zavřít"
            >
              <X className="w-5 h-5" />
            </button>

            {status === "success" ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Registrace odeslána!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Ozveme se vám s přístupovými údaji k Pro trialu na {email}.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-lg bg-pink text-white font-medium hover:bg-pink/90 transition-colors"
                >
                  Zavřít
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  Získat Pro API klíč
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  14 dní zdarma. Bez platební karty.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-foreground mb-1">
                      Email *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@firma.cz"
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink/50 focus:border-pink transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-company" className="block text-sm font-medium text-foreground mb-1">
                      Firma / Projekt *
                    </label>
                    <input
                      id="reg-company"
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="MedTech s.r.o."
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink/50 focus:border-pink transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-usecase" className="block text-sm font-medium text-foreground mb-1">
                      Jak budete API používat?
                    </label>
                    <select
                      id="reg-usecase"
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-pink/50 focus:border-pink transition-colors"
                    >
                      {USE_CASES.map((uc) => (
                        <option key={uc} value={uc}>{uc}</option>
                      ))}
                    </select>
                  </div>

                  {errorMsg && (
                    <p className="text-sm text-red-400">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full py-3 rounded-lg bg-pink text-white font-medium hover:bg-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Odesílám...
                      </>
                    ) : (
                      "Získat 14denní trial"
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
