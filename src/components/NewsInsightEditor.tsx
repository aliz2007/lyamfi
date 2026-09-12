import { useState } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Panneau d'édition du commentaire de rédaction (« l'œil de Lyamfi »),
 * réservé aux administrateurs.
 *
 * La langue de rédaction est celle de l'interface au moment de
 * l'enregistrement : c'est elle qui est gravée en base (`lang`), et les deux
 * autres langues sont traduites automatiquement juste après. Masquer ce
 * panneau aux non-admins n'est qu'un confort : la RPC revérifie is_admin().
 */
export function NewsInsightEditor({
  initialBody,
  pending,
  onSave,
  onCancel,
}: {
  initialBody: string;
  pending: boolean;
  onSave: (body: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [body, setBody] = useState(initialBody);
  const ready = body.trim().length > 0;

  return (
    <div className="space-y-3 rounded-xl border border-primary/40 bg-background/60 p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder={t("newsfeed.insightPlaceholder")}
        aria-label={t("newsfeed.insightTitle")}
        className="w-full resize-y rounded-xl border border-input bg-background/60 px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!ready || pending}
          onClick={() => onSave(body.trim())}
          className="rounded-full bg-gradient-gold px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? t("common.saving") : t("newsfeed.insightSave")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("newsfeed.insightCancel")}
        </button>
      </div>
    </div>
  );
}
