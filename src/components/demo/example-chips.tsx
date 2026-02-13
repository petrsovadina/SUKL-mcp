"use client";

const EXAMPLES = [
  "Ibuprofen",
  "Paralen",
  "Lékárny v Brně",
  "ATC N02",
  "0254045",
];

const ENRICHED_EXAMPLES = [
  { label: "Vyhledat lék", query: "Paralen", icon: "🔍" },
  { label: "Detail přípravku", query: "0027561", icon: "💊" },
  { label: "ATC skupina", query: "ATC N02BE01", icon: "🏷️" },
  { label: "Dostupnost", query: "Ibalgin 400", icon: "📦" },
];

interface ExampleChipsProps {
  onSelect: (query: string) => void;
  enriched?: boolean;
}

export function ExampleChips({ onSelect, enriched = false }: ExampleChipsProps) {
  if (enriched) {
    return (
      <div className="flex flex-wrap gap-2 justify-center py-4">
        <p className="w-full text-center text-sm text-muted-foreground mb-2">
          Zkuste například:
        </p>
        {ENRICHED_EXAMPLES.map((ex) => (
          <button
            key={ex.query}
            onClick={() => onSelect(ex.query)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
          >
            <span aria-hidden="true">{ex.icon}</span>
            <span className="text-muted-foreground">{ex.label}:</span>
            <span className="font-medium">{ex.query}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      <p className="w-full text-center text-sm text-muted-foreground mb-2">
        Zkuste například:
      </p>
      {EXAMPLES.map((example) => (
        <button
          key={example}
          onClick={() => onSelect(example)}
          className="px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
        >
          {example}
        </button>
      ))}
    </div>
  );
}
