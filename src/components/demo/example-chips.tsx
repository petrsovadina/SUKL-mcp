"use client";

const EXAMPLES = [
  "Ibuprofen",
  "Paralen",
  "Lékárny v Brně",
  "ATC N02",
  "0254045",
];

interface ExampleChipsProps {
  onSelect: (example: string) => void;
}

export function ExampleChips({ onSelect }: ExampleChipsProps) {
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
