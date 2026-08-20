import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Award, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  buildLevelProgress,
  lessonsQuery,
  PASS_SCORE,
  progressQuery,
  type QuizQuestion,
} from "@/lib/market";
import { LessonContent } from "@/components/LessonContent";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/academie/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Module ${params.slug} — Lyamfi` },
      {
        name: "description",
        content:
          "Leçon courte suivie d'un quiz de 10 questions pour valider ta compréhension et débloquer ton badge.",
      },
      { property: "og:title", content: "Module pédagogique — Lyamfi" },
      {
        property: "og:description",
        content: "Apprends puis valide tes acquis avec un quiz de 10 questions.",
      },
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
  const [result, setResult] = useState<{ score: number; total: number; percent: number } | null>(
    null,
  );

  if (!lesson) return <p className="text-sm text-muted-foreground">Chargement du module…</p>;

  const { levels } = buildLevelProgress(lessons, progress);
  const levelState = levels.find((l) => l.level === lesson.level);

  if (levelState && !levelState.unlocked) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Module verrouillé</h1>
        <p className="text-sm text-muted-foreground">
          Termine tous les modules du niveau précédent pour accéder au niveau {lesson.level}.
        </p>
        <Link to="/academie" className="inline-block text-sm text-primary">
          Retour aux modules
        </Link>
      </div>
    );
  }

  const quiz = (lesson.quiz as unknown as QuizQuestion[]) ?? [];
  const existing = progress.find((p) => p.lesson_id === lesson.id);

  const submit = async () => {
    const score = quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    const percent = Math.round((score / Math.max(1, quiz.length)) * 100);
    setResult({ score, total: quiz.length, percent });
    const passed = percent >= PASS_SCORE;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: u.user.id,
        lesson_id: lesson.id,
        completed: passed || Boolean(existing?.completed),
        score: Math.max(percent, existing?.score ?? 0),
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
      passed
        ? `Badge débloqué — ${percent}% de bonnes réponses !`
        : `${percent}% — il faut ${PASS_SCORE}% pour valider, réessaie`,
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/academie"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Modules pédagogiques
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wider text-primary">{lesson.level}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{lesson.summary}</p>
        {existing?.completed && (
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-accent px-3 py-1.5 text-xs text-accent-foreground">
            <Award className="h-3.5 w-3.5" /> Module validé — meilleur score {existing.score}%
          </span>
        )}
      </header>

      <article className="surface-card p-6 sm:p-8">
        <LessonContent content={lesson.content} />
      </article>

      {quiz.length > 0 && (
        <section className="surface-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Quiz de validation</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {quiz.length} questions — {PASS_SCORE}% de bonnes réponses pour débloquer le badge.
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-gold transition-all"
              style={{ width: `${(Object.keys(answers).length / quiz.length) * 100}%` }}
            />
          </div>
          <ol className="mt-6 space-y-6">
            {quiz.map((q, i) => {
              const chosen = answers[i];
              const correct = chosen === q.answer;
              return (
                <li key={i}>
                  <p className="text-sm font-medium">
                    {i + 1}. {q.q}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((o, oi) => {
                      const selected = chosen === oi;
                      // Après validation on montre la bonne réponse, et on
                      // marque en rouge le mauvais choix effectivement fait.
                      const isAnswer = oi === q.answer;
                      const wrongPick = Boolean(result) && selected && !isAnswer;
                      const showCorrect = Boolean(result) && isAnswer;
                      return (
                        <button
                          key={oi}
                          disabled={Boolean(result)}
                          onClick={() => setAnswers({ ...answers, [i]: oi })}
                          className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                            showCorrect
                              ? "border-[var(--success)] text-[var(--success)]"
                              : wrongPick
                                ? "border-destructive text-destructive"
                                : selected
                                  ? "border-primary/60 bg-accent text-accent-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground"
                          } ${result ? "cursor-default" : ""}`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {result && q.explanation && (
                    <p className="mt-2.5 flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span aria-hidden="true" className={correct ? "text-[var(--success)]" : "text-destructive"}>
                        {correct ? "✓" : "✗"}
                      </span>
                      <span>{q.explanation}</span>
                    </p>
                  )}
                </li>
              );
            })}
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
              Résultat : <span className="font-semibold">{result.score}</span> / {result.total} (
              {result.percent}%) —{" "}
              {result.percent >= PASS_SCORE ? "module validé" : `${PASS_SCORE}% requis`}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
