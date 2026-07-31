import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Award } from "lucide-react";
import { toast } from "sonner";
import { lessonsQuery, progressQuery, type QuizQuestion } from "@/lib/market";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/academie/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Leçon ${params.slug} — Académie Lyamfi` },
      {
        name: "description",
        content: "Leçon courte suivie d'un quiz de validation pour progresser en bourse marocaine.",
      },
      { property: "og:title", content: "Leçon — Académie Lyamfi" },
      { property: "og:description", content: "Apprends puis valide tes acquis avec un quiz." },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const { data: lessons = [] } = useQuery(lessonsQuery);
  const { data: progress = [] } = useQuery(progressQuery);
  const lesson = lessons.find((l) => l.slug === slug);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  if (!lesson) return <p className="text-sm text-muted-foreground">Chargement de la leçon…</p>;

  const quiz = (lesson.quiz as unknown as QuizQuestion[]) ?? [];
  const existing = progress.find((p) => p.lesson_id === lesson.id);

  const submit = async () => {
    const score = quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    setResult({ score, total: quiz.length });
    const passed = score === quiz.length;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: u.user.id,
        lesson_id: lesson.id,
        completed: passed || Boolean(existing?.completed),
        score: Math.round((score / Math.max(1, quiz.length)) * 100),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["lesson_progress"] });
    toast[passed ? "success" : "message"](
      passed ? "Badge débloqué, leçon validée !" : `${score}/${quiz.length} — réessaie pour valider`,
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/academie"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Académie
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wider text-primary">{lesson.level}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{lesson.summary}</p>
        {existing?.completed && (
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-accent px-3 py-1.5 text-xs text-accent-foreground">
            <Award className="h-3.5 w-3.5" /> Leçon validée
          </span>
        )}
      </header>

      <article className="surface-card space-y-4 p-6 sm:p-8">
        {lesson.content.split("\n\n").map((para, i) => (
          <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {para.replace(/\*\*/g, "")}
          </p>
        ))}
      </article>

      {quiz.length > 0 && (
        <section className="surface-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Quiz de validation</h2>
          <ol className="mt-6 space-y-6">
            {quiz.map((q, i) => (
              <li key={i}>
                <p className="text-sm font-medium">
                  {i + 1}. {q.q}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((o, oi) => {
                    const selected = answers[i] === oi;
                    const showCorrect = result && oi === q.answer;
                    return (
                      <button
                        key={oi}
                        onClick={() => setAnswers({ ...answers, [i]: oi })}
                        className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                          showCorrect
                            ? "border-[var(--success)] text-[var(--success)]"
                            : selected
                              ? "border-primary/60 bg-accent text-accent-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
          <button
            onClick={submit}
            disabled={Object.keys(answers).length < quiz.length}
            className="mt-7 rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Valider le quiz
          </button>
          {result && (
            <p className="mt-4 text-sm">
              Résultat : <span className="font-semibold">{result.score}</span> / {result.total}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
