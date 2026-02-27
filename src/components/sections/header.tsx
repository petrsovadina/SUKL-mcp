"use client";

import { motion } from "framer-motion";
import { Github, ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PillIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between" aria-label="Hlavní navigace">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <PillIcon className="w-7 h-7 text-pink" />
          <span className="font-[family-name:var(--font-mono-display)] text-foreground group-hover:text-pink transition-colors">
            SÚKL MCP
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink href="#tools">Tools</NavLink>
          <NavLink href="#how-it-works">Jak to funguje</NavLink>
          <NavLink href="#pricing">Ceník</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
          
          <div className="h-4 w-px bg-dark-border" />
          
          <Link
            href="https://github.com/petrsovadina/SUKL-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </Link>
          
          <Link
            href="https://smithery.ai/server/@petrsovadina/sukl-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-pink text-white hover:bg-pink/90 transition-colors text-sm font-medium"
          >
            <span>Smithery</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-card border-b border-border"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <MobileNavLink href="#tools" onClick={() => setMobileMenuOpen(false)}>
              Tools
            </MobileNavLink>
            <MobileNavLink href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
              Jak to funguje
            </MobileNavLink>
            <MobileNavLink href="#pricing" onClick={() => setMobileMenuOpen(false)}>
              Ceník
            </MobileNavLink>
            <MobileNavLink href="#faq" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </MobileNavLink>
            <div className="flex gap-2 pt-2">
              <Link
                href="https://github.com/petrsovadina/SUKL-mcp"
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted"
              >
                <Github className="w-4 h-4" />
                GitHub
              </Link>
              <Link
                href="https://smithery.ai/server/@petrsovadina/sukl-mcp"
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-pink text-white"
              >
                Smithery
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-lg text-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
