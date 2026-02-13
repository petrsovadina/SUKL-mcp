"use client";

import Link from "next/link";
import { Github, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const DATA = {
  name: "Petr Sovadina",
  initials: "PS",
  description: "AI Engineer specializující se na healthcare AI, LangGraph a MCP integrace. Hledám nové příležitosti.",
  location: "Brno, Česko",
  locationLink: "https://maps.google.com/?q=Brno,Czech+Republic",
  contact: {
    email: "petr.sovadina9@gmail.com",
    tel: "+420774517607",
    social: {
      GitHub: { url: "https://github.com/petrsovadina" },
      LinkedIn: { url: "https://linkedin.com/in/petrsovadina" },
    },
  },
  navbar: [
    { href: "#tools", label: "Funkce" },
    { href: "#quickstart", label: "Rychlý start" },
    { href: "#faq", label: "FAQ" },
  ],
};

export function Footer() {
  return (
    <footer className="py-12 px-4 md:px-6 bg-background border-t border-border" role="contentinfo" aria-label="Zápatí stránky">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between">
          {/* Left column - Personal Brand */}
          <div className="mb-8 md:mb-0">
            <Link href="https://portfolio-sovadina.vercel.app" target="_blank" className="flex items-center gap-3">
              <img 
                src="https://i19jax5jy5.ufs.sh/f/f01c818a-c281-4f6e-911b-6c084570ea85-fb4hm4.png" 
                alt={DATA.initials} 
                className="w-8 h-8 object-contain"
              />
              <h2 className="text-lg font-bold text-foreground">{DATA.name}</h2>
            </Link>

            <p className="text-muted-foreground mt-4 max-w-md">
              {DATA.description}
            </p>
            
            <div className="mt-4 flex gap-3">
              <Link 
                href={DATA.contact.social.GitHub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-pink hover:bg-pink/5 transition-colors text-sm text-foreground"
              >
                <Github className="w-4 h-4" />
                GitHub
              </Link>
              <Link 
                href={DATA.contact.social.LinkedIn.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-pink hover:bg-pink/5 transition-colors text-sm text-foreground"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground mt-5">
              © {new Date().getFullYear()} {DATA.name}. Všechna práva vyhrazena.
            </p>
          </div>
          
          {/* Right columns - Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Navigace</h3>
              <ul className="space-y-2">
                {DATA.navbar.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Kontakt</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href={`mailto:${DATA.contact.email}`}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`tel:${DATA.contact.tel}`}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Telefon
                  </Link>
                </li>
                <li>
                  <Link 
                    href={DATA.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {DATA.location}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom - Large name with light/dark mode images */}
        <div className="w-full flex mt-8 items-center justify-center">
          <div className="relative">
            {/* Light mode image - dark text for light bg */}
            <img 
              src="https://i19jax5jy5.ufs.sh/f/c7c86d08-543f-47b5-bdb2-a7a1e426f825-t3fptr.dev.png" 
              alt={DATA.name} 
              className="light-logo max-w-full h-auto max-h-16 md:max-h-20 lg:max-h-24 object-contain opacity-70 hover:opacity-90 transition-opacity duration-300"
            />
            {/* Dark mode image - light text for dark bg */}
            <img 
              src="https://i19jax5jy5.ufs.sh/f/z2Za8Zqs0NofWQee3Xg8IkPwAlRNsHM03E56iZhmaY7BQ1DT" 
              alt={DATA.name} 
              className="dark-logo max-w-full h-auto max-h-16 md:max-h-20 lg:max-h-24 object-contain opacity-70 hover:opacity-90 transition-opacity duration-300"
            />
            {/* Fade-out gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
