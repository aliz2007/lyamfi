/** Champ texte court (prénom, nom), partagé par « Mon compte » et l'espace admin. */
export function TextField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  maxLength = 60,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete ?? "off"}
        placeholder={placeholder ?? ""}
        maxLength={maxLength}
        className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
