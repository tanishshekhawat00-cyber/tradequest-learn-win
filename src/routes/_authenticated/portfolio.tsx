import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, X } from "lucide-react";
import { usePortfolio, useRefreshPortfolio } from "@/hooks/use-portfolio";
import { AssetBadge, ChangePill, EmptyState, Stat } from "@/components/brand";
import { PriceChart, RangeTabs } from "@/components/price-chart";
import { TradeDialog } from "@/components/trade-dialog";
import { Button } from "@/components/ui/button";
import { fmtINR, fmtNum, fmtPct, fmtSigned, toneClass } from "@/lib/format";
import { portfolioSeries, riskScore } from "@/lib/portfolio";
import { cancelOrder } from "@/lib/trading.functions";
import type { Range } from "@/lib/market";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: pageMeta("Portfolio — TradeQuest", "Analyze your virtual holdings, allocation, paper-trading profit and loss, and open orders in TradeQuest.") }),
  component: PortfolioPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const LABEL: Record<string, string> = { market: "Market", limit: "Limit", stop_loss: "Stop-loss", take_profit: "Take-profit" };

function PortfolioPage() {
  const { data, summary, positions, now } = usePortfolio();
  const refresh = useRefreshPortfolio();
  const cancel = useServerFn(cancelOrder);
  const [range, setRange] = useState<Range>("1M");
  const [trade, setTrade] = useState<{ symbol: string; side: "buy" | "sell" } | null>(null);
  const minute = Math.floor(now / 60000);
  const series = useMemo(
    () => (data ? portfolioSeries(data.trades, Number(data.profile.starting_balance), data.profile.created_at, range, minute * 60000).map((d) => ({ t: d.t, v: d.value })) : []),
    [data, range, minute],
  );
  if (!data || !summary) return null;

  const best = positions.length ? [...positions].sort((a, b) => b.returnPct - a.returnPct)[0] : null;
  const worst = positions.length ? [...positions].sort((a, b) => a.returnPct - b.returnPct)[0] : null;
  const sectors = Object.entries(positions.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.asset.sector]: (acc[p.asset.sector] ?? 0) + p.value }), {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const pnl = positions.map((p) => ({ name: p.symbol, v: Math.round(p.unrealized) }));
  const risk = riskScore(positions, summary.cash, data.pending, data.trades);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold md:text-3xl">Portfolio</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total value" value={fmtINR(summary.total)} />
        <Stat label="Cash" value={fmtINR(summary.cash)} />
        <Stat label="Invested" value={fmtINR(summary.invested)} />
        <Stat label="Total return" value={fmtPct(summary.totalReturnPct)} sub={fmtSigned(summary.totalPnl)} tone={summary.totalPnl} />
        <Stat label="Daily return" value={fmtPct(summary.dayPct)} sub={fmtSigned(summary.dayPnl)} tone={summary.dayPnl} />
        <Stat label="Unrealized P&L" value={fmtSigned(summary.unrealized)} tone={summary.unrealized} />
        <Stat label="Best performer" value={best?.symbol ?? "—"} sub={best ? fmtPct(best.returnPct) : undefined} tone={best?.returnPct} />
        <Stat label="Worst performer" value={worst?.symbol ?? "—"} sub={worst ? fmtPct(worst.returnPct) : undefined} tone={worst?.returnPct} />
      </div>

      <div className="rounded-3xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Performance</h2><RangeTabs value={range} onChange={setRange} /></div>
        <div className="mt-4"><PriceChart data={series} range={range} positive={series.length < 2 || series[series.length - 1].v >= series[0].v} /></div>
      </div>

      <div className="rounded-3xl border bg-card">
        <div className="flex items-center justify-between p-5"><h2 className="font-semibold">Holdings</h2><span className="text-xs text-muted-foreground">{positions.length} positions</span></div>
        {positions.length === 0 ? (
          <div className="p-5 pt-0"><EmptyState icon={<Wallet className="size-5" />} title="No holdings yet" body="Buy your first asset from the Markets page." action={<Button asChild size="sm"><Link to="/markets">Explore markets</Link></Button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-y bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Asset", "Qty", "Avg. entry", "Current", "Value", "Unrealized P&L", "Return", ""].map((h) => <th key={h} className="px-5 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.symbol} className="border-b last:border-0">
                    <td className="px-5 py-3"><Link to="/markets/$symbol" params={{ symbol: p.symbol }} className="flex items-center gap-3"><AssetBadge symbol={p.symbol} className="size-8 text-[10px]" /><span><div className="font-semibold">{p.symbol}</div><div className="text-xs text-muted-foreground">{p.asset.sector}</div></span></Link></td>
                    <td className="num px-5">{fmtNum(p.quantity)}</td>
                    <td className="num px-5">{fmtINR(p.avg_price)}</td>
                    <td className="num px-5">{fmtINR(p.quote.price)}</td>
                    <td className="num px-5">{fmtINR(p.value)}</td>
                    <td className={`num px-5 ${toneClass(p.unrealized)}`}>{fmtSigned(p.unrealized)}</td>
                    <td className="px-5"><ChangePill pct={p.returnPct} /></td>
                    <td className="px-5 text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setTrade({ symbol: p.symbol, side: "buy" })}>Buy</Button><Button size="sm" variant="outline" onClick={() => setTrade({ symbol: p.symbol, side: "sell" })}>Sell / protect</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.pending.length > 0 && (
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-semibold">Open orders</h2>
          <ul className="mt-4 divide-y">
            {data.pending.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span><span className={o.side === "buy" ? "text-gain" : "text-loss"}>{o.side.toUpperCase()}</span> {o.quantity} {o.symbol} · {LABEL[o.order_type]} @ <span className="num">{fmtINR(o.trigger_price ?? 0)}</span></span>
                <Button size="sm" variant="ghost" onClick={async () => { try { await cancel({ data: { id: o.id } }); await refresh(); toast.success("Order cancelled"); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }}><X className="size-4" /> Cancel</Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-semibold">Sector allocation</h2>
          {sectors.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No sector exposure yet.</p> : (
            <div className="mt-2 h-56"><ResponsiveContainer><PieChart><Pie data={sectors} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none" isAnimationActive={false}>{sectors.map((s, i) => <Cell key={s.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} /></PieChart></ResponsiveContainer></div>
          )}
          <ul className="space-y-1 text-sm">{sectors.map((s, i) => <li key={s.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="flex-1">{s.name}</span><span className="num text-muted-foreground">{((s.value / summary.invested) * 100).toFixed(1)}%</span></li>)}</ul>
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-semibold">Profit / loss by asset</h2>
          {pnl.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nothing to show yet.</p> : (
            <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={pnl}><XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} /><YAxis hide /><Tooltip formatter={(v: number) => fmtSigned(v)} cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} /><Bar dataKey="v" radius={[6, 6, 6, 6]}>{pnl.map((d) => <Cell key={d.name} fill={d.v >= 0 ? "var(--gain)" : "var(--loss)"} />)}</Bar></BarChart></ResponsiveContainer></div>
          )}
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-semibold">Your Risk Score: <span className="num">{risk.score}/100</span></h2>
          <p className="text-sm text-muted-foreground">{risk.level}. Higher means more risk-taking.</p>
          <ul className="mt-4 space-y-3 text-sm">
            {risk.reasons.map((r) => (
              <li key={r.label}>
                <div className="flex justify-between"><span className="font-medium">{r.label}</span>{r.max > 0 && <span className="num text-muted-foreground">{r.points}/{r.max}</span>}</div>
                <p className="text-xs text-muted-foreground">{r.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-muted-foreground">An educational measure of your simulated portfolio, not personalised financial advice.</p>
        </div>
      </div>
      {trade && <TradeDialog key={trade.symbol + trade.side} symbol={trade.symbol} side={trade.side} open onOpenChange={(o) => !o && setTrade(null)} />}
    </div>
  );
}
