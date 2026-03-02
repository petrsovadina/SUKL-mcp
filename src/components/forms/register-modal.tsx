"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState(USE_CASES[0]);
  const [useCaseDetail, setUseCaseDetail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      trackEvent("form_open", { form: "register" });
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    trackEvent("form_submit", { form: "register" });

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          useCase,
          useCaseDetail: useCase === "Jiné" ? useCaseDetail : undefined,
          gdprConsentAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Něco se pokazilo.");
        setStatus("error");
        trackEvent("form_error", { form: "register" });
        return;
      }

      setStatus("success");
      trackEvent("form_success", { form: "register" });
    } catch {
      setErrorMsg("Nepodařilo se odeslat. Zkuste to znovu.");
      setStatus("error");
      trackEvent("form_error", { form: "register" });
    }
  }

  function handleClose() {
    setStatus("idle");
    setName("");
    setEmail("");
    setCompany("");
    setUseCase(USE_CASES[0]);
    setUseCaseDetail("");
    setGdprConsent(false);
    setErrorMsg("");
    onClose();
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink/50 focus:border-pink transition-colors";

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
            className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                    <label htmlFor="reg-name" className="block text-sm font-medium text-foreground mb-1">
                      Jméno *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jan Novák"
                      className={inputClass}
                    />
                  </div>

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
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
                    >
                      {USE_CASES.map((uc) => (
                        <option key={uc} value={uc}>{uc}</option>
                      ))}
                    </select>
                  </div>

                  <AnimatePresence>
                    {useCase === "Jiné" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label htmlFor="reg-usecase-detail" className="block text-sm font-medium text-foreground mb-1">
                          Popište váš use case
                        </label>
                        <input
                          id="reg-usecase-detail"
                          type="text"
                          value={useCaseDetail}
                          onChange={(e) => setUseCaseDetail(e.target.value)}
                          placeholder="Např. integrace do interního nástroje..."
                          className={inputClass}
                          maxLength={500}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-start gap-3">
                    <input
                      id="reg-gdpr"
                      type="checkbox"
                      checked={gdprConsent}
                      onChange={(e) => setGdprConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-border text-pink focus:ring-pink/50"
                    />
                    <label htmlFor="reg-gdpr" className="text-sm text-muted-foreground">
                      Souhlasím se{" "}
                      <a href="/privacy" className="text-pink hover:underline">
                        zpracováním osobních údajů
                      </a>{" "}
                      za účelem poskytnutí služby. *
                    </label>
                  </div>

                  {errorMsg && (
                    <p className="text-sm text-red-400">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading" || !gdprConsent}
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
