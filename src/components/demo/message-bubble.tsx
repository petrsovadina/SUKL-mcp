import { MedicineCard } from "./medicine-card";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: string;
  data?: Record<string, unknown>;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-[var(--sukl-navy,#1a365d)] text-white rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <AssistantContent message={message} />
        )}
      </div>
    </div>
  );
}

function AssistantContent({ message }: { message: Message }) {
  const { type, data } = message;

  if (type === "search" && data?.results) {
    const results = data.results as Array<Record<string, string | null>>;
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Nalezeno {data.total as number} výsledků ({data.time_ms as number}ms)
        </p>
        {results.map((med, i) => (
          <MedicineCard
            key={i}
            name={med.name || ""}
            strength={med.strength}
            form={med.form}
            package_size={med.package}
            atc_code={med.atc_code}
            substance={med.substance}
            sukl_code={med.sukl_code || ""}
          />
        ))}
      </div>
    );
  }

  if (type === "detail" && data?.medicine) {
    const med = data.medicine as Record<string, string | null>;
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Detail léku</p>
        <MedicineCard
          name={med.name || ""}
          strength={med.strength}
          form={med.form}
          package_size={med.package}
          atc_code={med.atc_code}
          substance={med.substance}
          sukl_code={med.sukl_code || ""}
        />
        {med.dispensing && (
          <p className="text-xs text-muted-foreground">
            Výdej: {med.dispensing}
          </p>
        )}
      </div>
    );
  }

  if (type === "pharmacy") {
    const pharmacies = (data?.pharmacies as Array<Record<string, unknown>>) || [];
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {pharmacies.length > 0
            ? `Nalezeno ${data?.total as number} lékáren`
            : "Žádné lékárny nenalezeny (data lékáren zatím nejsou v databázi)"}
        </p>
        {pharmacies.map((p, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-3 text-sm"
          >
            <p className="font-medium">{p.name as string}</p>
            <p className="text-muted-foreground text-xs">
              {p.address as string}, {p.city as string}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "atc" && data?.info) {
    const info = data.info as Record<string, unknown>;
    const medicines = (data?.medicines as Array<Record<string, string | null>>) || [];
    return (
      <div className="space-y-2">
        <div className="bg-card border border-border rounded-lg p-3 text-sm">
          <p className="font-medium">
            ATC {info.code as string}: {info.name_cs as string}
          </p>
          <p className="text-xs text-muted-foreground">
            Úroveň: {info.level as number}
            {info.parent_code ? ` | Nadřazený: ${info.parent_code as string}` : null}
          </p>
        </div>
        {medicines.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              Léky v této skupině ({data.medicines_total as number} celkem):
            </p>
            {medicines.slice(0, 5).map((med, i) => (
              <MedicineCard
                key={i}
                name={med.name || ""}
                strength={med.strength}
                form={med.form}
                package_size={med.package}
                atc_code={med.atc_code}
                substance={med.substance}
                sukl_code={med.sukl_code || ""}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  // Fallback — plain text
  return <p className="text-sm">{message.content}</p>;
}
