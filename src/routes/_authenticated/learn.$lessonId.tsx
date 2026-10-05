import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLesson } from "@/lib/lessons";
import { completeLesson } from "@/lib/trading.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/learn/$lessonId")({
  loader: ({ params }) => { const l = getLesson(params.lessonId); if (!l) throw notFound(); return { id: l.id }; },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData ? getLesson(loaderData.id)?.title : "Lesson"} — TradeQuest` }] }),
  notFoundComponent: () => <div className="p-10 text-center">Lesson not found. <Link to="/learn" className="underline">Back</Link></div>,
  errorComponent: () => <div className="p-10 text-center">Couldn't load this lesson.</div>,
  component: LessonPage,
});

function LessonPage() {
  const { id } = Route.useLoaderData();
  const lesson = getLesson(id)!;
  const submit = useServerFn(completeLesson);
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    try {
      const r = await submit({ data: { lessonId: id, answers } });
      setResult(r);
      if (r.passed) { toast.success(r.xp ? `Lesson complete · +${r.xp} XP` : "Passed again — XP already earned"); qc.invalidateQueries(); }
      else toast.error(`Score ${r.score}% — review and try again`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link to="/learn" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Learning Center</Link>
      <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{lesson.level} · {lesson.minutes} min · +{lesson.xp} XP</p><h1 className="mt-1 text-3xl font-semibold">{lesson.title}</h1></div>
      {lesson.body.map((p) => <p key={p} className="leading-relaxed">{p}</p>)}
      <div className="rounded-2xl border-l-4 border-primary bg-accent/40 p-4"><div className="text-xs font-semibold uppercase tracking-wider">Example</div><p className="mt-1 text-sm">{lesson.example}</p></div>
      <section className="rounded-3xl border bg-card p-5">
        <h2 className="font-semibold">Quiz</h2>
        {lesson.quiz.map((q, qi) => (
          <div key={q.q} className="mt-4">
            <p className="text-sm font-medium">{qi + 1}. {q.q}</p>
            <div className="mt-2 grid gap-2">
              {q.options.map((o, oi) => {
                const chosen = answers[qi] === oi;
                const show = result && chosen;
                return <button key={o} onClick={() => { const a = [...answers]; a[qi] = oi; setAnswers(a); setResult(null); }} className={cn("rounded-xl border px-3 py-2 text-left text-sm", chosen && "border-primary", show && (oi === q.answer ? "border-gain bg-gain/10" : "border-loss bg-loss/10"))}>{o}</button>;
              })}
            </div>
          </div>
        ))}
        <Button className="mt-5 w-full" disabled={busy || answers.filter((a) => a != null).length < lesson.quiz.length} onClick={check}>{busy ? "Checking…" : "Submit answers"}</Button>
      </section>
    </article>
  );
}
