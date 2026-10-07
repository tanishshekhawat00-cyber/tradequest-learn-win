import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AssetBadge, ChangePill, SimBadge, Stat } from "@/components/brand";
import { TradingChart } from "@/components/trading-chart";
import { QuoteStatus } from "@/components/market-overview";
import { TradeDialog } from "@/components/trade-dialog";
import { getAsset, getHistory, getQuote, type Range } from "@/lib/market";
import { fmtCompact, fmtINR, fmtNum, fmtPct, fmtSigned, toneClass } from "@/lib/format";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useWatchlistMutations, useWatchlists } from "@/hooks/use-watchlists";

export const Route = createFileRoute("/_authenticated/markets/$symbol")({
  loader: ({ params }) => {
    const a = getAsset(params.symbol);
    if (!a || a.sector === "Index") throw notFound();
    return { symbol: a.symbol };
  },
  head: ({ loaderData }) => ({ meta: pageMeta(loaderData ? `${loaderData.symbol} charts — TradeQuest` : "Stock charts — TradeQuest", `Analyze ${loaderData?.symbol ?? "stocks"} with simulated candlesticks, volume, RSI and MACD. Trade only virtual money in TradeQuest.`) }),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="font-semibold">Asset not found</p>
      <Link to="/markets" className="mt-2 inline-block text-sm text-primary underline">Back to markets</Link>
    </div>
  ),
  errorComponent: () => <div className="p-10 text-center">Couldn't load this asset.</div>,
  component: AssetPage,
});

function AssetPage() {
  const { symbol } = Route.useLoaderData();
  const asset = getAsset(symbol);
  const { positions, now } = usePortfolio();
  const [range, setRange] = useState<Range>("1D");
  const [trade, setTrade] = useState<"buy" | "sell" | null>(null);
  const wl = useWatchlists();
  const m = useWatchlistMutations();
  const q = getQuote(symbol, now);
  const hist = useMemo(() => getHistory(symbol, range, now, 160).map((d) => ({ t: d.t, v: d.price })), [symbol, range, now]);
  const rangeChange = ((hist[hist.length - 1].v - hist[0].v) / hist[0].v) * 100;
  const pos = positions.find((p) => p.symbol === symbol);
  const inLists = (wl.data ?? []).filter((w) => w.items.some((i) => i.symbol === symbol));
  if (!asset) return null;

  return (
    <div className="space-y-6">
      <Link to="/markets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Markets</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AssetBadge symbol={symbol} className="size-14 text-sm" />
          <div>
            <h1 className="text-2xl font-semibold">{asset.name}</h1>
            <p className="text-sm text-muted-foreground">{symbol} · {asset.sector} · {asset.industry}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Add to watchlist"><Star className={inLists.length ? "fill-highlight text-highlight" : ""} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Watchlists</DropdownMenuLabel>
              {(wl.data ?? []).length === 0 && <DropdownMenuItem asChild><Link to="/watchlist">Create a watchlist</Link></DropdownMenuItem>}
              {(wl.data ?? []).map((w) => {
                const item = w.items.find((i) => i.symbol === symbol);
                return (
                  <DropdownMenuItem key={w.id} onClick={() => (item ? m.removeItem.mutate(item.id) : m.add.mutate({ watchlistId: w.id, symbol }))}>
                    <Star className={item ? "fill-highlight text-highlight" : ""} /> {w.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" disabled={!pos} onClick={() => setTrade("sell")}>Sell</Button>
          <Button onClick={() => setTrade("buy")}>Buy</Button>
        </div>
      </div>

      <div className="min-w-0 rounded-lg border bg-card p-3 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="num text-4xl font-semibold">{fmtINR(q.price)}</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={`num ${toneClass(rangeChange)}`}>{fmtPct(rangeChange)}</span>
              <span className="text-muted-foreground">{range === "1D" ? "past 24h" : `past ${range}`}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2"><SimBadge /><QuoteStatus now={now} /></div>
        </div>
        <div className="mt-4"><TradingChart symbol={symbol} now={now} range={range} onRangeChange={setRange} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Today" value={fmtPct(q.changePct)} sub={fmtSigned(q.change)} tone={q.change} />
        <Stat label="Day high" value={fmtINR(q.dayHigh)} />
        <Stat label="Day low" value={fmtINR(q.dayLow)} />
        <Stat label="Prev close" value={fmtINR(q.prevClose)} />
        <Stat label="Volume" value={fmtCompact(q.volume)} />
        <Stat label="Sector" value={asset.sector} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-semibold">About {asset.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{asset.about}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Industry</dt><dd className="font-medium">{asset.industry}</dd></div>
            <div><dt className="text-muted-foreground">Relative volatility</dt><dd className="num font-medium">{asset.vol.toFixed(2)}×</dd></div>
          </dl>
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-semibold">Your position</h2>
          {pos ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Shares</dt><dd className="num font-medium">{fmtNum(pos.quantity)}</dd></div>
              <div><dt className="text-muted-foreground">Avg. entry</dt><dd className="num font-medium">{fmtINR(pos.avg_price)}</dd></div>
              <div><dt className="text-muted-foreground">Value</dt><dd className="num font-medium">{fmtINR(pos.value)}</dd></div>
              <div><dt className="text-muted-foreground">Unrealized P&L</dt><dd className={`num font-medium ${toneClass(pos.unrealized)}`}>{fmtSigned(pos.unrealized)} ({fmtPct(pos.returnPct)})</dd></div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">You don't hold {symbol}. Buy a few shares to practise — it's virtual money.</p>
          )}
          {pos && <ChangePill pct={pos.returnPct} className="mt-4" />}
        </div>
      </div>
      {trade && <TradeDialog key={trade} symbol={symbol} side={trade} open onOpenChange={(o) => !o && setTrade(null)} />}
    </div>
  );
}
