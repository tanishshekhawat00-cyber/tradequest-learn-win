import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { ASSETS, getQuote, SECTORS } from "@/lib/market";
import { fmtINR, fmtPct, toneClass } from "@/lib/format";

export function QuoteStatus({ now }: { now: number }) {
  return <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-gain" /><span>Simulated feed · updates every 5s</span><time className="num" dateTime={new Date(now).toISOString()}>{new Date(now).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" })} IST</time></div>;
}

export function MarketOverview({ now }: { now: number }) {
  const quotes = ASSETS.map((a) => ({ ...a, ...getQuote(a.symbol, now) }));
  const advancers = quotes.filter((q) => q.change > 0).length;
  const decliners = quotes.filter((q) => q.change < 0).length;
  const unchanged = quotes.length - advancers - decliners;
  const ranked = [...quotes].sort((a, b) => b.changePct - a.changePct);
  return <section className="space-y-5 border-y py-5" aria-label="Market overview">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Market pulse</h2><QuoteStatus now={now} /></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-3"><h3 className="text-xs text-muted-foreground">Market breadth · {quotes.length} stocks</h3><div className="grid h-3 grid-cols-24 overflow-hidden rounded-sm" aria-label={`${advancers} advancing, ${decliners} declining, ${unchanged} unchanged stocks`}>{quotes.map((q) => <span key={q.symbol} title={`${q.symbol} ${fmtPct(q.changePct)}`} className={q.change > 0 ? "bg-gain" : q.change < 0 ? "bg-loss" : "bg-muted"} />)}</div><div className="flex flex-wrap gap-4 text-xs"><span className="flex items-center gap-1 text-gain"><ArrowUpRight className="size-3" />{advancers} advancing</span><span className="flex items-center gap-1 text-loss"><ArrowDownRight className="size-3" />{decliners} declining</span><span className="flex items-center gap-1 text-muted-foreground"><Minus className="size-3" />{unchanged} flat</span></div>
        <div className="grid grid-cols-2 gap-4 pt-3">{[ranked[0], ranked.at(-1)].map((q, i) => q && <Link key={i} to="/markets/$symbol" params={{ symbol: q.symbol }} className="min-w-0"><p className="text-xs text-muted-foreground">{i === 0 ? "Strongest" : "Weakest"}</p><p className="mt-1 truncate text-sm font-semibold">{q.symbol}</p><p className={`num text-xs ${toneClass(q.changePct)}`}>{fmtPct(q.changePct)}</p><p className="num text-xs text-muted-foreground">{fmtINR(q.price)}</p></Link>)}</div>
      </div>
      <div><h3 className="mb-3 text-xs text-muted-foreground">Sector heatmap · average daily change</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{SECTORS.map((sector) => {
        const members = quotes.filter((q) => q.sector === sector);
        const avg = members.reduce((sum, q) => sum + q.changePct, 0) / members.length;
        return <div key={sector} className={`min-w-0 rounded-md border p-3 ${avg >= 0 ? "border-gain/20 bg-gain/10" : "border-loss/20 bg-loss/10"}`}><p className="text-xs font-medium">{sector}</p><p className={`num mt-1 text-sm ${toneClass(avg)}`}>{fmtPct(avg)}</p></div>;
      })}</div></div>
    </div>
  </section>;
}