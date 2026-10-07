import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LESSONS, LEVELS } from "@/lib/lessons";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({ meta: pageMeta("Learning Center — TradeQuest", "Learn investing fundamentals with TradeQuest lessons, examples and quizzes.") }),
  component: Learn,
});

export function useLessonProgress() {
  return useQuery({ queryKey: ["lesson-progress"], queryFn: async () => { const { data } = await supabase.from("lesson_progress").select("lesson_id, quiz_score"); return new Set((data ?? []).map((d) => d.lesson_id)); } });
}

function Learn() {
  const { data: done } = useLessonProgress();
  const n = done?.size ?? 0;
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-semibold md:text-3xl">Learning Center</h1><p className="text-sm text-muted-foreground">{n} of {LESSONS.length} lessons completed</p><Progress value={(n / LESSONS.length) * 100} className="mt-3 h-2 max-w-md" /></div>
      {LEVELS.map((lvl) => (
        <section key={lvl}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{lvl}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LESSONS.filter((l) => l.level === lvl).map((l) => (
              <Link key={l.id} to="/learn/$lessonId" params={{ lessonId: l.id }} className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary">
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="size-3" /> {l.minutes} min</span><span className="num">+{l.xp} XP</span></div>
                <h3 className="mt-2 font-semibold">{l.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{l.summary}</p>
                {done?.has(l.id) && <div className="mt-3 flex items-center gap-1 text-xs text-gain"><CheckCircle2 className="size-3.5" /> Completed</div>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
