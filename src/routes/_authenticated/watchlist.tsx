import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Trash2, X } from "lucide-react";
import { useWatchlistMutations, useWatchlists } from "@/hooks/use-watchlists";
import { useNow } from "@/hooks/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangePill, EmptyState } from "@/components/brand";
import { getQuote } from "@/lib/market";
import { fmtINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({ meta: pageMeta("Watchlists — TradeQuest", "Follow your favorite simulated Indian stocks with TradeQuest watchlists.") }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { data } = useWatchlists();
  const m = useWatchlistMutations();
  const now = useNow();
  const [name, setName] = useState("");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold md:text-3xl">Watchlists</h1>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { m.create.mutate(name); setName(""); } }}>
        <Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="New watchlist, e.g. Long Term" />
        <Button disabled={!name.trim()}>Create</Button>
      </form>
      {(data ?? []).length === 0 && <EmptyState icon={<Star className="size-5" />} title="No watchlists" body="Create one above, then star assets from Markets." />}
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((w) => (
          <div key={w.id} className="rounded-3xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{w.name}</h2>
              <Button size="icon" variant="ghost" aria-label="Delete watchlist" onClick={() => m.remove.mutate(w.id)}><Trash2 className="size-4" /></Button>
            </div>
            {w.items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Empty. <Link to="/markets" className="underline">Add assets</Link></p> : (
              <ul className="mt-3 divide-y">
                {w.items.map((i) => { const q = getQuote(i.symbol, now); return (
                  <li key={i.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <Link to="/markets/$symbol" params={{ symbol: i.symbol }} className="flex-1 font-medium">{i.symbol}</Link>
                    <span className="num">{fmtINR(q.price)}</span><ChangePill pct={q.changePct} />
                    <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => m.removeItem.mutate(i.id)}><X className="size-4" /></Button>
                  </li>); })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
