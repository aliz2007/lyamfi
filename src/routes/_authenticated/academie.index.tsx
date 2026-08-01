import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Circle, Lock } from "lucide-react";
import { buildLevelProgress, lessonsQuery, progressQuery } from "@/lib/market";

export const Route = createFileRoute("/_authenticated/academie/")({
  head: () => ({
    meta: [
      { title: "Modules pédagogiques — bourse marocaine | Lyamfi" },
      {
        name: "description",
        content:
          "15 modules en 3 niveaux progressifs : actions, Bourse de Casablanca, OPCVM, MASI, IPO, OPA et obligations.",
      },
      { property: "og:title", content: "Modules pédagogiques — Lyamfi" },
      {
        property: "og:description",
        content: "Leçons courtes, quiz de 10 questions et badges de progression.",
      },
    ],
  }),
  component: Academy,
});

function Academy() {
  const { data: lessons = [] } = useQuery(lessonsQuery);
  const { data: progress = [] } = useQuery(progressQuery);
  const { levels, doneIds, done, total, ratio } = buildLevelProgress(lessons, progress);

  return (
    <div className="space-y-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold sm:text-4xl">Modules pédagogiques</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {done} / {total} modules validés — 3 niveaux progressifs
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground">
          <Award className="h-4 w-4 text-primary" /> {done} badge(s)
        </span>
      </header>

      <div className="surface-card p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progression globale</span>
          <span className="font-semibold text-gradient-gold">{ratio}%</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${ratio}%` }} />
        </div>
      </div>

      {levels.map(({ level, items, done: levelDone, total: levelTotal, unlocked }) => {
        if (!items.length) return null;
        return (
          <section key={level}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">{level}</h2>
              <span className="text-xs text-muted-foreground">
                {levelDone} / {levelTotal}
              </span>
              {!unlocked && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Termine le niveau précédent
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((l, i) => {
                const isDone = doneIds.has(l.id);
                if (!unlocked) {
                  return (
                    <div
                      key={l.id}
                      className="surface-card cursor-not-allowed p-6 opacity-50"
                      aria-disabled="true"
                    >
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <h3 className="mt-4 font-medium">
                        {i + 1}. {l.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Module verrouillé
                      </p>
                    </div>
                  );
                }
                return (
                  <Link
                    key={l.id}
                    to="/academie/$slug"
                    params={{ slug: l.slug }}
                    className="surface-card p-6 transition-colors hover:border-primary/50"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h3 className="mt-4 font-medium">
                      {i + 1}. {l.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{l.summary}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
