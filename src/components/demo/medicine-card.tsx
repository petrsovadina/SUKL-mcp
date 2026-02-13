interface MedicineCardProps {
  name: string;
  strength: string | null;
  form: string | null;
  package_size: string | null;
  atc_code: string | null;
  substance: string | null;
  sukl_code: string;
}

export function MedicineCard({
  name,
  strength,
  form,
  package_size,
  atc_code,
  substance,
  sukl_code,
}: MedicineCardProps) {
  const details = [strength, form, package_size]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="bg-card border border-border rounded-lg p-3 text-sm">
      <div className="font-medium flex items-center gap-1.5">
        <span>💊</span>
        <span>{name}</span>
      </div>
      {details && (
        <p className="text-muted-foreground mt-1 ml-6">{details}</p>
      )}
      <div className="flex gap-3 mt-1 ml-6 text-xs text-muted-foreground">
        {atc_code && <span>ATC: {atc_code}</span>}
        {substance && <span>Látka: {substance}</span>}
        <span className="opacity-50">#{sukl_code}</span>
      </div>
    </div>
  );
}
