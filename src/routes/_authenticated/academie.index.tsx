import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Circle } from "lucide-react";
import { LEVELS, lessonsQuery, progressQuery } from "@/lib/market";

export const Route = createFileRoute("/_authenticated/academie/")({
  head: () => ({
    meta: [
      { title: "Académie — parcours bourse marocaine | Lyamfi" },
      {
        name: "description",
        content:
          "Parcours Débutant, Intermédiaire et Avancé : actions, bilan, PER/PEG, AMMC et gestion du risque.",
      },
      { property: "og:title", content: "Académie Lyamfi" },
      { property: "og:description", content: "Leçons courtes, quiz et badges de progression." },
    ],
  }),
  component: Academy,
});

function Academy() {
  const { data: lessons = [] } = useQuery(lessonsQuery);
  const { data: progress = [] } = useQuery(progressQuery);
  const doneIds = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));

  return (
    <div className="space-y-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold sm:text-4xl">Académie</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {doneIds.size} / {lessons.length} leçons validées
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground">
          <Award className="h-4 w-4 text-primary" /> {doneIds.size} badge(s)
        </span>
      </header>

      {LEVELS.map((level) => {
        const items = lessons.filter((l) => l.level === level);
        if (!items.length) return null;
        return (
          <section key={level}>
            <h2 className="text-lg font-semibold">{level}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((l) => {
                const done = doneIds.has(l.id);
                return (
                  <Link
                    key={l.id}
                    to="/academie/$slug"
                    params={{ slug: l.slug }}
                    className="surface-card p-6 transition-colors hover:border-primary/50"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h3 className="mt-4 font-medium">{l.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {l.summary}
                    </p>
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
