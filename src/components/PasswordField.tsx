import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { PasswordCheck } from "@/lib/password";

/** Champ mot de passe avec bascule d'affichage : on ne tape jamais à l'aveugle. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  invalid,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  invalid?: boolean | undefined;
  hint?: string | undefined;
}) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border bg-background/60 py-3 pl-4 pr-12 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            invalid ? "border-destructive" : "border-input"
          }`}
          placeholder="••••••••"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("pw.hide") : t("pw.show")}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-destructive">{hint}</p>}
    </div>
  );
}

/** Liste de contrôle des règles de mot de passe, avec jauge de robustesse. */
export function PasswordRules({
  value,
  check,
  max,
}: {
  value: string;
  check: PasswordCheck;
  max: number;
}) {
  const t = useT();

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium">{t("pw.mustContain")}</p>
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">{t(check.strengthKey)}</span>
        )}
      </div>

      <div className="mt-2 flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              value.length > 0 && i < check.strength ? "bg-gradient-gold" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {check.results.map(({ rule, ok }) => (
          <li key={rule.id} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full transition-colors ${
                ok
                  ? "bg-[var(--success)] text-background"
                  : "border border-muted-foreground/50 text-transparent"
              }`}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
            </span>
            <span className={ok ? "text-foreground" : "text-muted-foreground"}>
              {t(rule.labelKey, rule.vars)}
            </span>
            <span className="sr-only">{ok ? t("pw.met") : t("pw.missing")}</span>
          </li>
        ))}
      </ul>

      {check.tooLong && <p className="mt-3 text-xs text-destructive">{t("pw.tooLong", { max })}</p>}
    </div>
  );
}
