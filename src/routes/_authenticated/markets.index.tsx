import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AssetBadge, ChangePill, EmptyState, SimBadge } from "@/components/brand";
import { Sparkline } from "@/components/price-chart";
import { getHistory, getQuote, searchAssets, SECTORS } from "@/lib/market";
import { fmtCompact, fmtINR } from "@/lib/format";
import { useNow } from "@/hooks/use-portfolio";
import { cn } from "@/lib/utils";
import { MarketOverview } from "@/components/market-overview";

export const Route = createFileRoute("/_authenticated/markets/")({
  head: () => ({ meta: [{ title: "Markets — TradeQuest" }] }),
  component: Markets,
});

function Markets() {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string | null>(null);
  const now = useNow();
  const results = useMemo(() => searchAssets(q).filter((a) => !sector || a.sector === sector), [q, sector]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Markets</h1>
          <p className="text-sm text-muted-foreground">Search by name, symbol, sector or industry.</p>
        </div>
        <SimBadge />
      </div>
      <MarketOverview now={now} />
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “bank”, “TCS” or “Pharmaceuticals”" className="h-12 rounded-2xl pl-11 text-base" autoFocus />
      </div>
      <div className="flex flex-wrap gap-2">
        {[null, ...SECTORS].map((s) => (
          <button key={s ?? "all"} onClick={() => setSector(s)} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", sector === s ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {s ?? "All sectors"}
          </button>
        ))}
      </div>
      {results.length === 0 ? (
        <EmptyState icon={<Search className="size-5" />} title="No matches" body="Try a different name, symbol or sector." />
      ) : (
        <div className="overflow-hidden rounded-3xl border bg-card">
          {results.map((a) => {
            const quote = getQuote(a.symbol, now);
            const h = getHistory(a.symbol, "1D", now, 30).map((d) => d.price);
            return (
              <Link key={a.symbol} to="/markets/$symbol" params={{ symbol: a.symbol }} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0 hover:bg-muted/40">
                <AssetBadge symbol={a.symbol} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.symbol}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.name} · {a.industry}</div>
                </div>
                <div className="hidden md:block"><Sparkline data={h} positive={quote.changePct >= 0} /></div>
                <div className="hidden w-20 text-right text-xs text-muted-foreground sm:block">Vol {fmtCompact(quote.volume)}</div>
                <div className="w-28 text-right">
                  <div className="num font-medium">{fmtINR(quote.price)}</div>
                  <ChangePill pct={quote.changePct} className="mt-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
