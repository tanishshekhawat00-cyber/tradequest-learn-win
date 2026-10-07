import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Progress } from "@/components/ui/progress";
import { CHALLENGES } from "@/lib/challenges";

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({ meta: pageMeta("Challenges — TradeQuest", "Track daily, weekly and monthly paper-trading and learning challenges in TradeQuest.") }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const { data, summary, positions, now } = usePortfolio();
  if (!data || !summary) return null;
  const cin = { returnPct: summary.totalReturnPct, positions, trades: data.trades, pending: data.pending, lessonsDone: data.lessonsDone, createdAt: data.profile.created_at };
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold md:text-3xl">Challenges</h1><p className="text-sm text-muted-foreground">Progress updates automatically from your simulated activity.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {CHALLENGES.map((c) => {
          const p = c.progress(cin);
          const pct = Math.min(100, (p.current / p.target) * 100);
          return (
            <div key={c.id} className="rounded-3xl border bg-card p-5">
              <div className="flex items-center justify-between text-xs"><span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">{c.cadence}</span><span className="text-muted-foreground">{formatDistanceToNowStrict(c.endsAt(now))} left</span></div>
              <h2 className="mt-3 font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <Progress value={pct} className="mt-4 h-2" />
              <div className="mt-2 flex justify-between text-xs"><span className="num">{p.label}</span>{pct >= 100 && <span className="flex items-center gap-1 text-gain"><CheckCircle2 className="size-3.5" /> Completed</span>}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
