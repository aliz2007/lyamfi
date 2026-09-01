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
      {/* Sur téléphone l'icône est du décor qui coûte 22 px dans un en-tête
          qui n'en a pas. Les deux libellés suffisent à dire ce que c'est. */}
      <Languages
        className="ml-2 mr-0.5 hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block"
        aria-hidden="true"
      />
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          title={l.label}
          className={`press inline-flex min-h-9 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors sm:min-h-0 sm:py-1 ${
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
