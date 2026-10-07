import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getLeaderboard } from "@/lib/trading.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtPct, toneClass } from "@/lib/format";
import { levelFor } from "@/lib/levels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: pageMeta("Leaderboard — TradeQuest", "Compare paper-trading returns and learning progress on the TradeQuest leaderboard.") }),
  component: Leaderboard,
});

const TABS = [
  { k: "returnPct", l: "Return %" },
  { k: "xp", l: "XP" },
  { k: "lessons", l: "Learning" },
  { k: "weekTrades", l: "Weekly activity" },
] as const;

function Leaderboard() {
  const fn = useServerFn(getLeaderboard);
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard"], queryFn: () => fn() });
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("returnPct");
  const rows = [...(data ?? [])].sort((a, b) => b[tab] - a[tab]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold md:text-3xl">Leaderboard</h1><p className="text-sm text-muted-foreground">Ranked by return %, never by absolute virtual money.</p></div>
      <div className="inline-flex rounded-full bg-secondary p-1">{TABS.map((t) => <button key={t.k} onClick={() => setTab(t.k)} className={cn("rounded-full px-3 py-1 text-xs font-medium", tab === t.k ? "bg-background shadow-sm" : "text-muted-foreground")}>{t.l}</button>)}</div>
      {isLoading ? <Skeleton className="h-64 rounded-3xl" /> : (
        <div className="overflow-hidden rounded-3xl border bg-card">
          {rows.map((r, i) => (
            <div key={r.username + i} className={cn("flex items-center gap-4 border-b px-5 py-3 last:border-0", r.isMe && "bg-accent/50")}>
              <span className="num w-8 text-lg font-semibold text-muted-foreground">{i + 1}</span>
              <div className="flex-1"><div className="font-medium">{r.displayName}{r.isMe && " (you)"}</div><div className="text-xs text-muted-foreground">@{r.username} · {levelFor(r.xp).name}</div></div>
              <div className="text-right text-sm">
                {tab === "returnPct" && <span className={`num font-semibold ${toneClass(r.returnPct)}`}>{fmtPct(r.returnPct)}</span>}
                {tab === "xp" && <span className="num font-semibold">{r.xp} XP</span>}
                {tab === "lessons" && <span className="num font-semibold">{r.lessons} lessons</span>}
                {tab === "weekTrades" && <span className="num font-semibold">{r.weekTrades} trades</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
