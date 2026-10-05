import { createFileRoute } from "@tanstack/react-router";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Stat } from "@/components/brand";
import { levelFor, LEVEL_NAMES } from "@/lib/levels";
import { fmtINR, fmtPct } from "@/lib/format";
import { tradeStats } from "@/lib/portfolio";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — TradeQuest" }] }),
  component: Profile,
});

function Profile() {
  const { data, summary } = usePortfolio();
  if (!data || !summary) return null;
  const p = data.profile;
  const lvl = levelFor(p.xp);
  const s = tradeStats(data.trades);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">{p.avatar_url && <AvatarImage src={p.avatar_url} />}<AvatarFallback>{(p.display_name ?? "T")[0]}</AvatarFallback></Avatar>
        <div><h1 className="text-2xl font-semibold">{p.display_name}</h1><p className="text-sm capitalize text-muted-foreground">@{p.username} · {p.experience}</p></div>
      </div>
      <div className="rounded-3xl border bg-card p-5">
        <div className="flex justify-between"><span className="font-semibold">{lvl.name}</span><span className="num text-sm text-muted-foreground">{p.xp} XP</span></div>
        <Progress value={lvl.progress} className="mt-3 h-2" />
        <div className="mt-3 flex flex-wrap gap-2">{LEVEL_NAMES.map((n, i) => <span key={n} className={`rounded-full px-2 py-0.5 text-xs ${i <= lvl.index ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{n}</span>)}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Starting balance" value={fmtINR(Number(p.starting_balance), true)} />
        <Stat label="Return" value={fmtPct(summary.totalReturnPct)} tone={summary.totalReturnPct} />
        <Stat label="Trades" value={String(s.count)} />
        <Stat label="Win rate" value={s.closed ? `${s.winRate.toFixed(0)}%` : "—"} />
      </div>
    </div>
  );
}
