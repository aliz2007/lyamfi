import { Languages } from "lucide-react";
import { LANGS, useI18n } from "@/lib/i18n";

/**
 * Bascule français / anglais.
 *
 * Deux langues seulement : un groupe de boutons montre l'état courant sans
 * clic, là où un menu déroulant le cacherait derrière une interaction.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={`inline-flex items-center gap-0.5 rounded-full border border-border/80 bg-card/60 p-0.5 ${className}`}
    >
      <Languages
        className="ml-2 mr-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          title={l.label}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors ${
            lang === l.id
              ? "bg-gradient-gold text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
