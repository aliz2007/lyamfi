import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { shareholdersOf } from "@/lib/shareholders";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

/**
 * La carte « Structure actionnariale » de la fiche valeur.
 *
 * Donnée : `lib/shareholders.ts`, le classeur « Actionnariat BVC » transcrit
 * en constantes (même philosophie que les secteurs et les modes de cotation).
 * La carte reçoit le code de la cote et se débrouille seule : pas de donnée,
 * pas de donut — un message discret, jamais un plantage.
 *
 * Le flottant (« Divers Actionnaires », « Autres actionnaires ») est toujours
 * rendu en gris bleuté, quelle que soit sa position : c'est le solde, pas un
 * actionnaire, et sa couleur ne doit pas changer selon son rang. Les autres
 * parts suivent la palette dans l'ordre décroissant du classeur.
 */

/** Parts nommées : saturées mais sourdes, pensées pour le fond quasi noir. */
const PALETTE = [
  "oklch(0.82 0.15 88)", // or, la couleur de la maison
  "oklch(0.66 0.1 220)", // bleu pétrole
  "oklch(0.7 0.13 160)", // émeraude
  "oklch(0.62 0.11 290)", // violet sourd
  "oklch(0.72 0.09 55)", // sable chaud
  "oklch(0.64 0.09 190)", // sarcelle
  "oklch(0.64 0.1 20)", // brique douce
  "oklch(0.6 0.06 250)", // ardoise
] as const;

/** Le solde : gris bleuté, distinct de tout actionnaire nommé. */
const FLOAT_COLOR = "oklch(0.52 0.02 250)";

/** Vrai pour le flottant, quelle que soit la langue ou l'étiquette du classeur. */
const isFloat = (name: string) => {
  const n = name.toUpperCase();
  return n.startsWith("DIVERS") || n.startsWith("FLOTTANT") || n.startsWith("AUTRES ACTIONNAIRES");
};

export function ShareholdingCard({ code }: { code: string }) {
  const { t } = useI18n();
  const f = useFormat();

  const shareholders = shareholdersOf(code);

  // La couleur suit le rang parmi les actionnaires NOMMÉS : un flottant placé
  // au milieu du classeur ne doit pas décaler la palette de ceux qui suivent.
  const slices = useMemo(() => {
    let named = 0;
    return (shareholders ?? []).map((s) => ({
      ...s,
      color: isFloat(s.name) ? FLOAT_COLOR : PALETTE[named++ % PALETTE.length],
    }));
  }, [shareholders]);

  // Les actionnaires recensés au centre du donut : le flottant n'est pas un
  // actionnaire, c'est le reste du capital — il ne compte pas.
  const holdersCount = shareholders?.filter((s) => !isFloat(s.name)).length ?? 0;

  return (
    <section className="surface-raised p-5">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("share.title")}
      </h2>

      {slices.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("share.none")}</p>
      ) : (
        <>
          <div className="relative mx-auto mt-4 h-52 w-full max-w-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="pct"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="var(--background)"
                  strokeWidth={2}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "var(--popover-foreground)" }}
                  formatter={(v) => f.pct(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Posé en surimpression plutôt qu'en <Label> Recharts : le libellé
                est traduit, et le donut n'a pas à être recalculé pour un
                changement de langue. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold tabular-nums text-gradient-gold">{holdersCount}</p>
              <p className="text-[11px] text-muted-foreground">{t("share.holdersUnit")}</p>
            </div>
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("share.details")}
          </p>
          <ul className="mt-3 space-y-3.5">
            {slices.map((s) => (
              <li key={s.name}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-sm text-foreground/90" title={s.name}>
                    {s.name}
                  </p>
                  <p
                    className="shrink-0 text-sm font-medium tabular-nums"
                    style={{ color: s.color }}
                  >
                    {f.pct(s.pct)}
                  </p>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(s.pct, 100)}%`, background: s.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
