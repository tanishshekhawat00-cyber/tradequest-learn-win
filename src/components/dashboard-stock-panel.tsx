import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetBadge } from "@/components/brand";
import { fmtCompact, fmtINR, fmtNum, fmtPct, fmtSigned, toneClass } from "@/lib/format";
import { getQuote, priceAt } from "@/lib/market";
import type { Position } from "@/lib/portfolio";

export function DashboardStockPanel({ symbol, now, position }: { symbol: string; now: number; position?: Position }) {
  const q = getQuote(symbol, now);
  const dayStart = now - ((now + 5.5 * 3600000) % 86400000);
  return (
    <section aria-label={`${symbol} stock details`} className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><AssetBadge symbol={symbol} className="size-8 text-[9px]" /><h2 className="text-sm font-semibold">{symbol}</h2></div>
        <Button asChild variant="ghost" size="icon" className="size-8"><Link to="/markets/$symbol" params={{ symbol }} aria-label={`Open ${symbol} chart`}><ArrowUpRight className="size-4" /></Link></Button>
      </div>
      <div className="num mt-4 text-2xl font-semibold">{fmtINR(q.price)}</div>
      <p className={`num mt-1 text-xs ${toneClass(q.change)}`}>{fmtSigned(q.change)} <span className="ml-2">{fmtPct(q.changePct)}</span></p>
      <div className="mt-5 border-t pt-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Market data · simulated</h3>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Open</dt><dd className="num text-right">{fmtINR(priceAt(symbol, dayStart), true)}</dd>
          <dt className="text-muted-foreground">High</dt><dd className="num text-right">{fmtINR(q.dayHigh, true)}</dd>
          <dt className="text-muted-foreground">Low</dt><dd className="num text-right">{fmtINR(q.dayLow, true)}</dd>
          <dt className="text-muted-foreground">Volume</dt><dd className="num text-right">{fmtCompact(q.volume)}</dd>
        </dl>
      </div>
      <div className="mt-4 border-t pt-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fundamentals</h3>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
          <dt className="text-muted-foreground">P/E</dt><dd className="num text-right text-muted-foreground">—</dd>
          <dt className="text-muted-foreground">EPS</dt><dd className="num text-right text-muted-foreground">—</dd>
          <dt className="text-muted-foreground">Market cap</dt><dd className="num text-right text-muted-foreground">—</dd>
        </dl>
        <p className="mt-2 text-[10px] text-muted-foreground">Unavailable in the simulated feed</p>
      </div>
      <div className="mt-4 border-t pt-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your position</h3>
        {position ? <div className="space-y-1.5 text-xs"><div className="num font-medium">{fmtNum(position.quantity)} shares</div><div className="text-muted-foreground">Avg. <span className="num">{fmtINR(position.avg_price)}</span></div><div className={`num font-medium ${toneClass(position.unrealized)}`}>P&L {fmtSigned(position.unrealized)}</div></div> : <p className="text-xs text-muted-foreground">No shares held</p>}
      </div>
    </section>
  );
}