import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ArrowRight, BookOpen, Search, Sparkles, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useWatchlists } from "@/hooks/use-watchlists";
import { AssetBadge, ChangePill, EmptyState, SimBadge, Stat } from "@/components/brand";
import { PriceChart, RangeTabs, Sparkline } from "@/components/price-chart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardStockPanel } from "@/components/dashboard-stock-panel";
import { PortfolioRiskMeter } from "@/components/portfolio-risk-meter";
import { fmtINR, fmtPct, fmtSigned, toneClass } from "@/lib/format";
import { ASSETS, getHistory, getQuote, INDEX, type Range } from "@/lib/market";
import { portfolioSeries, riskScore, tradeStats } from "@/lib/portfolio";
import { CHALLENGES } from "@/lib/challenges";
import { getLeaderboard } from "@/lib/trading.functions";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: pageMeta("Dashboard — TradeQuest", "Track virtual portfolio value, paper-trading returns, allocation and risk in TradeQuest.") }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Dashboard() {
  const { data, summary, positions, now } = usePortfolio();
  const [range, setRange] = useState<Range>("1D");
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const lbFn = useServerFn(getLeaderboard);
  const lb = useQuery({ queryKey: ["leaderboard"], queryFn: () => lbFn() });
  const wl = useWatchlists();
  const minute = Math.floor(now / 60000);
  const series = useMemo(
    () => (data ? portfolioSeries(data.trades, Number(data.profile.starting_balance), data.profile.created_at, range, minute * 60000).map((d) => ({ t: d.t, v: d.value })) : []),
    [data, range, minute],
  );
  if (!data || !summary) return null;
  const p = data.profile;
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
  const topMovers = [...positions].sort((a, b) => Math.abs(b.quote.changePct) - Math.abs(a.quote.changePct)).slice(0, 3);
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (p.display_name ?? p.username ?? "Trader").trim().split(/\s+/)[0];
  const selectedPosition = positions.find((p) => p.symbol === selectedSymbol);

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
          <h1 className="text-2xl font-semibold md:text-3xl">{greeting}, {firstName} <span aria-hidden="true">👋</span></h1>
          <p className="mt-2 text-xs text-muted-foreground">{format(new Date(now), "EEEE, d MMMM yyyy")} · TradeQuest</p>
        </div>
        <SimBadge />
      </div>

      <section aria-label="Portfolio overview" className="grid grid-cols-1 gap-5 border-b pb-6 sm:grid-cols-3 sm:gap-6">
        <div><p className="text-xs text-muted-foreground">Portfolio value</p><div className="num mt-2 text-2xl font-semibold xl:text-3xl">{fmtINR(summary.total, true)}</div></div>
        <div><p className="text-xs text-muted-foreground">Today's P&L</p><div className={`num mt-2 text-2xl font-semibold xl:text-3xl ${toneClass(summary.dayPnl)}`}>{fmtSigned(summary.dayPnl)}</div><div className={`num mt-2 flex items-center gap-1 text-xs ${toneClass(summary.dayPct)}`}>{summary.dayPct >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}{fmtPct(summary.dayPct)}</div></div>
        <div><p className="text-xs text-muted-foreground">Total return</p><div className={`num mt-2 text-2xl font-semibold xl:text-3xl ${toneClass(summary.totalReturnPct)}`}>{fmtPct(summary.totalReturnPct)}</div><p className="mt-2 text-xs text-muted-foreground">Since you started</p></div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-8">
        <div className="min-w-0">
          <section aria-labelledby="performance-heading">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="performance-heading" className="text-base font-semibold">Portfolio Performance</h2><span className="text-xs text-muted-foreground">{range === "ALL" ? "All time" : range} · INR</span></div>
            <div className="mt-4"><PriceChart data={series} range={range} height={300} positive={series.length < 2 || series[series.length - 1].v >= series[0].v} /></div>
            <div className="mt-3 flex justify-center"><RangeTabs value={range} onChange={setRange} ranges={["1D", "1W", "1M", "3M", "ALL"]} /></div>
          </section>
          <section aria-labelledby="top-movers-heading" className="mt-6 border-t pt-5">
            <div className="mb-3 flex items-center justify-between"><h2 id="top-movers-heading" className="text-sm font-semibold">Your top movers</h2><span className="text-[10px] text-muted-foreground">Today</span></div>
            {topMovers.length ? <div className="divide-y">{topMovers.map((p) => <Button key={p.symbol} variant="ghost" onClick={() => setSelectedSymbol(p.symbol)} aria-pressed={selectedSymbol === p.symbol} className="h-14 w-full justify-between rounded-none px-0 hover:px-2"><span className="flex items-center gap-3"><AssetBadge symbol={p.symbol} className="size-8 text-[9px]" /><span className="text-xs font-semibold">{p.symbol}</span></span><span className="flex items-center gap-4"><Sparkline data={getHistory(p.symbol, "1D", now, 30).map((d) => d.price)} positive={p.quote.changePct >= 0} /><span className={`num w-20 text-right text-xs ${toneClass(p.quote.changePct)}`}>{fmtPct(p.quote.changePct)}</span></span></Button>)}</div> : <div className="flex flex-wrap items-center justify-between gap-3 py-4"><p className="text-sm text-muted-foreground">No holdings yet.</p><Button asChild variant="outline" size="sm"><Link to="/markets">Explore stocks <ArrowRight className="size-3.5" /></Link></Button></div>}
          </section>
        </div>
        <aside className="grid min-w-0 gap-6 border-t pt-6 md:grid-cols-2 xl:grid-cols-1 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <DashboardStockPanel symbol={selectedSymbol} now={now} position={selectedPosition} />
          <PortfolioRiskMeter positions={positions} cash={summary.cash} pending={data.pending} trades={data.trades} />
        </aside>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total P&L" value={fmtSigned(summary.totalPnl)} tone={summary.totalPnl} />
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

