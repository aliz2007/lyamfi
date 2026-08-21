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
import { useI18n } from "@/lib/i18n";
import { levelKey } from "@/lib/levels";

export const Route = createFileRoute("/_authenticated/academie/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Module ${params.slug} | Lyamfi` },
      {
        name: "description",
        content:
          "Leçon courte suivie d'un quiz de 10 questions pour valider ta compréhension et débloquer ton badge.",
      },
      { property: "og:title", content: "Module pédagogique | Lyamfi" },
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
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: lessons = [] } = useQuery(lessonsQuery);
  const { data: progress = [] } = useQuery(progressQuery);
  const lesson = lessons.find((l) => l.slug === slug);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; percent: number } | null>(
    null,
  );

  if (!lesson) return <p className="text-sm text-muted-foreground">{t("lesson.loading")}</p>;

  const { levels } = buildLevelProgress(lessons, progress);
  const levelState = levels.find((l) => l.level === lesson.level);

  if (levelState && !levelState.unlocked) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t("lesson.lockedTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("lesson.lockedText", { level: t(levelKey(lesson.level)) })}
        </p>
        <Link to="/academie" className="inline-block text-sm text-primary">
          {t("lesson.backToModules")}
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
        ? t("lesson.toastOk", { percent })
        : t("lesson.toastKo", { percent, pass: PASS_SCORE }),
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/academie"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("lesson.breadcrumb")}
      </Link>

      <header className="rise">
        <p className="eyebrow">{t(levelKey(lesson.level))}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{lesson.summary}</p>
        {existing?.completed && (
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-accent px-3 py-1.5 text-xs text-accent-foreground">
            <Award className="h-3.5 w-3.5" /> {t("lesson.passed", { score: existing.score })}
          </span>
        )}
      </header>

      <article className="surface-raised p-6 sm:p-8">
        <LessonContent content={lesson.content} />
      </article>

      {quiz.length > 0 && (
        <section className="surface-raised p-6 sm:p-8">
          <h2 className="text-lg font-semibold">{t("lesson.quizTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("lesson.quizIntro", { n: quiz.length, pass: PASS_SCORE })}
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
                      <span
                        aria-hidden="true"
                        className={correct ? "text-[var(--success)]" : "text-destructive"}
                      >
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
            {t("lesson.submit")}
          </button>
          {result && (
            <p className="mt-4 text-sm">
              {t("lesson.result", {
                score: result.score,
                total: result.total,
                percent: result.percent,
              })}{" "}
              <span
                className={
                  result.percent >= PASS_SCORE ? "text-[var(--success)]" : "text-muted-foreground"
                }
              >
                {result.percent >= PASS_SCORE
                  ? t("lesson.resultOk")
                  : t("lesson.resultKo", { pass: PASS_SCORE })}
              </span>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
