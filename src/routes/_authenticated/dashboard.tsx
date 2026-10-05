import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ArrowRight, BookOpen, Search, ShieldAlert, Sparkles, Trophy } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useWatchlists } from "@/hooks/use-watchlists";
import { AssetBadge, ChangePill, EmptyState, SimBadge, Stat } from "@/components/brand";
import { PriceChart, RangeTabs, Sparkline } from "@/components/price-chart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmtINR, fmtPct, fmtSigned, toneClass } from "@/lib/format";
import { ASSETS, getAsset, getHistory, getQuote, INDEX, type Range } from "@/lib/market";
import { portfolioSeries, riskScore, tradeStats } from "@/lib/portfolio";
import { CHALLENGES } from "@/lib/challenges";
import { getLeaderboard } from "@/lib/trading.functions";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TradeQuest" }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Dashboard() {
  const { data, summary, positions, now } = usePortfolio();
  const [range, setRange] = useState<Range>("1M");
  const lbFn = useServerFn(getLeaderboard);
  const lb = useQuery({ queryKey: ["leaderboard"], queryFn: () => lbFn() });
  const wl = useWatchlists();
  if (!data || !summary) return null;
  const p = data.profile;

  const series = useMemo(
    () => portfolioSeries(data.trades, Number(p.starting_balance), p.created_at, range, now).map((d) => ({ t: d.t, v: d.value })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.trades, range, Math.floor(now / 60000)],
  );
  const risk = riskScore(positions, summary.cash, data.pending, data.trades);
  const stats = tradeStats(data.trades);
  const alloc = [
    ...positions.slice(0, 5).map((x) => ({ name: x.symbol, value: x.value })),
    ...(positions.length > 5 ? [{ name: "Other", value: positions.slice(5).reduce((s, x) => s + x.value, 0) }] : []),
    { name: "Cash", value: summary.cash },
  ];
  const rank = lb.data ? [...lb.data].sort((a, b) => b.returnPct - a.returnPct).findIndex((r) => r.isMe) + 1 : null;
  const cin = { returnPct: summary.totalReturnPct, positions, trades: data.trades, pending: data.pending, lessonsDone: data.lessonsDone, createdAt: p.created_at };
  const movers = ASSETS.map((a) => getQuote(a.symbol, now)).sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 5);
  const idx = getQuote(INDEX.symbol, now);
  const watch = wl.data?.[0];

  const insights: string[] = [];
  if (positions.length === 0) insights.push("You haven't opened a position yet. Try a small market order to see how fills and P&L work.");
  if (risk.reasons[0]?.points >= 20) insights.push("One holding dominates your portfolio. Read 'What is diversification?' to see how concentration affects swings.");
  if (positions.length && !data.pending.some((o) => o.order_type === "stop_loss")) insights.push("None of your holdings has a stop-loss. Practising exits is as important as entries.");
  if (stats.closed >= 3) insights.push(`You've closed ${stats.closed} trades with a ${stats.winRate.toFixed(0)}% win rate and ${fmtSigned(stats.realized)} realized P&L.`);
  if (data.lessonsDone < 3) insights.push("Complete a few beginner lessons to earn XP and unlock a stronger foundation.");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, {p.display_name ?? p.username}</p>
          <h1 className="text-2xl font-semibold md:text-3xl">Your trading desk</h1>
        </div>
        <SimBadge />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border bg-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Portfolio value</div>
              <div className="num mt-1 text-4xl font-semibold">{fmtINR(summary.total)}</div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className={`num ${toneClass(summary.totalPnl)}`}>{fmtSigned(summary.totalPnl)}</span>
                <ChangePill pct={summary.totalReturnPct} />
                <span className="text-muted-foreground">all time</span>
              </div>
            </div>
            <RangeTabs value={range} onChange={setRange} ranges={["1D", "1W", "1M", "3M", "1Y", "ALL"]} />
          </div>
          <div className="mt-4">
            <PriceChart data={series} range={range} positive={series.length < 2 || series[series.length - 1].v >= series[0].v} />
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Risk score</h2>
            <ShieldAlert className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className="num text-5xl font-semibold">{risk.score}</span>
            <span className="pb-1.5 text-muted-foreground">/100 · {risk.level}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gradient-to-r from-gain via-chart-3 to-loss">
            <div className="h-full bg-background/70" style={{ marginLeft: `${risk.score}%` }} />
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {risk.reasons.slice(0, 4).map((r) => (
              <li key={r.label} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="num">{r.points}/{r.max}</span>
              </li>
            ))}
          </ul>
          <Link to="/portfolio" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Why this score <ArrowRight className="size-3.5" /></Link>
          <p className="mt-3 text-[11px] text-muted-foreground">Educational metric only — not financial advice.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Today's P&L" value={fmtSigned(summary.dayPnl)} sub={fmtPct(summary.dayPct)} tone={summary.dayPnl} />
        <Stat label="Total P&L" value={fmtSigned(summary.totalPnl)} tone={summary.totalPnl} />
        <Stat label="Return" value={fmtPct(summary.totalReturnPct)} tone={summary.totalReturnPct} />
        <Stat label="Virtual cash" value={fmtINR(summary.cash)} />
        <Stat label="Invested" value={fmtINR(summary.invested)} />
        <Stat label="Leaderboard" value={rank ? `#${rank}` : "—"} sub={lb.data ? `of ${lb.data.length} traders` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Allocation" action={<Link to="/portfolio" className="text-xs text-muted-foreground hover:text-foreground">Details</Link>}>
          <div className="flex items-center gap-4">
            <div className="size-36 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={alloc} dataKey="value" innerRadius={44} outerRadius={68} paddingAngle={2} stroke="none" isAnimationActive={false}>
                    {alloc.map((a, i) => <Cell key={a.name} fill={a.name === "Cash" ? "var(--secondary)" : COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm">
              {alloc.map((a, i) => (
                <li key={a.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: a.name === "Cash" ? "var(--secondary)" : COLORS[i % COLORS.length] }} />
                  <span className="flex-1 truncate">{a.name}</span>
                  <span className="num text-muted-foreground">{((a.value / summary.total) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Insights" action={<Sparkles className="size-4 text-highlight" />}>
          <ul className="space-y-3 text-sm">
            {insights.slice(0, 3).map((t) => <li key={t} className="rounded-xl bg-muted/50 p-3">{t}</li>)}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">Rule-based educational observations about your simulated activity.</p>
        </Card>

        <Card title="Market overview" action={<Link to="/markets" className="text-xs text-muted-foreground hover:text-foreground">All markets</Link>}>
          <div className="mb-3 flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <div>
              <div className="text-xs text-muted-foreground">{INDEX.name}</div>
              <div className="num font-semibold">{idx.price.toLocaleString("en-IN")}</div>
            </div>
            <ChangePill pct={idx.changePct} />
          </div>
          <ul className="space-y-2">
            {movers.map((m) => (
              <li key={m.symbol}>
                <Link to="/markets/$symbol" params={{ symbol: m.symbol }} className="flex items-center justify-between text-sm hover:opacity-80">
                  <span className="font-medium">{m.symbol}</span>
                  <span className="flex items-center gap-3"><span className="num">{fmtINR(m.price)}</span><ChangePill pct={m.changePct} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={watch ? watch.name : "Watchlist"} action={<Link to="/watchlist" className="text-xs text-muted-foreground hover:text-foreground">Manage</Link>}>
          {!watch || watch.items.length === 0 ? (
            <EmptyState icon={<Search className="size-5" />} title="Nothing watched yet" body="Star assets from the Markets page to track them here." action={<Button asChild size="sm" variant="outline"><Link to="/markets">Browse markets</Link></Button>} />
          ) : (
            <ul className="space-y-3">
              {watch.items.slice(0, 6).map((it) => {
                const q = getQuote(it.symbol, now);
                const h = getHistory(it.symbol, "1D", now, 30).map((d) => d.price);
                return (
                  <li key={it.id}>
                    <Link to="/markets/$symbol" params={{ symbol: it.symbol }} className="flex items-center gap-3">
                      <span className="flex-1 text-sm font-medium">{it.symbol}</span>
                      <Sparkline data={h} positive={q.changePct >= 0} />
                      <span className="w-24 text-right"><div className="num text-sm">{fmtINR(q.price)}</div><div className={`num text-xs ${toneClass(q.changePct)}`}>{fmtPct(q.changePct)}</div></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Recent trades" action={<Link to="/history" className="text-xs text-muted-foreground hover:text-foreground">History</Link>}>
          {data.trades.length === 0 ? (
            <EmptyState icon={<Trophy className="size-5" />} title="No trades yet" body="Your first simulated trade earns bonus XP." action={<Button asChild size="sm"><Link to="/markets">Make a trade</Link></Button>} />
          ) : (
            <ul className="space-y-3">
              {data.trades.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center gap-3 text-sm">
                  <AssetBadge symbol={t.symbol} className="size-8 text-[10px]" />
                  <div className="flex-1">
                    <div className="font-medium">{t.side === "buy" ? "Bought" : "Sold"} {t.quantity} {t.symbol}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(t.created_at), "d MMM, HH:mm")}</div>
                  </div>
                  <div className="text-right">
                    <div className="num">{fmtINR(t.value)}</div>
                    {t.realized_pnl != null && <div className={`num text-xs ${toneClass(t.realized_pnl)}`}>{fmtSigned(t.realized_pnl)}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active challenges" action={<Link to="/challenges" className="text-xs text-muted-foreground hover:text-foreground">All</Link>}>
          <ul className="space-y-4">
            {CHALLENGES.slice(0, 4).map((c) => {
              const pr = c.progress(cin);
              return (
                <li key={c.id}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{c.title}</span><span className="num text-xs text-muted-foreground">{pr.label}</span></div>
                  <Progress value={Math.min(100, (pr.current / pr.target) * 100)} className="mt-2 h-1.5" />
                </li>
              );
            })}
          </ul>
          <Link to="/learn" className="mt-5 flex items-center gap-2 rounded-xl bg-accent p-3 text-sm font-medium text-accent-foreground">
            <BookOpen className="size-4" /> {data.lessonsDone} lessons completed · keep learning
          </Link>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{title}</h2>{action}</div>
      {children}
    </div>
  );
}

export { getAsset };
