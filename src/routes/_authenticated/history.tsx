import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, History } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/brand";
import { fmtINR, fmtNum, fmtPct, fmtSigned, toneClass } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: pageMeta("Trade history — TradeQuest", "Review and export your simulated stock trades and realized returns in TradeQuest.") }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data } = usePortfolio();
  const [asset, setAsset] = useState("all");
  const [side, setSide] = useState("all");
  const [result, setResult] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const trades = data?.trades ?? [];
  const symbols = useMemo(() => Array.from(new Set(trades.map((t) => t.symbol))).sort(), [trades]);

  const rows = trades.filter((t) => {
    if (asset !== "all" && t.symbol !== asset) return false;
    if (side !== "all" && t.side !== side) return false;
    if (result === "profit" && !(Number(t.realized_pnl) > 0)) return false;
    if (result === "loss" && !(Number(t.realized_pnl) < 0)) return false;
    const d = t.created_at.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const ret = (t: (typeof trades)[number]) => (t.realized_pnl != null && t.cost_basis ? (Number(t.realized_pnl) / (Number(t.cost_basis) * t.quantity)) * 100 : null);

  function exportCsv() {
    const head = ["Date", "Asset", "Side", "Quantity", "Price", "Value", "Realized P&L", "Return %", "Status"];
    const lines = rows.map((t) => [new Date(t.created_at).toISOString(), t.symbol, t.side, t.quantity, t.price, t.value, t.realized_pnl ?? "", ret(t)?.toFixed(2) ?? "", "Filled"].join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tradequest-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold md:text-3xl">Trade history</h1>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}><Download /> Export CSV</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={asset} onValueChange={setAsset}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All assets</SelectItem>{symbols.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={side} onValueChange={setSide}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Buy & sell</SelectItem><SelectItem value="buy">Buy</SelectItem><SelectItem value="sell">Sell</SelectItem></SelectContent></Select>
        <Select value={result} onValueChange={setResult}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any result</SelectItem><SelectItem value="profit">Profitable</SelectItem><SelectItem value="loss">Loss</SelectItem></SelectContent></Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<History className="size-5" />} title={trades.length ? "No trades match your filters" : "No trades yet"} body={trades.length ? "Adjust the filters above." : "Your simulated trades will appear here."} />
      ) : (
        <div className="overflow-x-auto rounded-3xl border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{["Date", "Asset", "Side", "Qty", "Price", "Value", "P&L", "Return", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const r = ret(t);
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(t.created_at), "d MMM yyyy, HH:mm")}</td>
                    <td className="px-4 font-semibold">{t.symbol}</td>
                    <td className={`px-4 font-medium ${t.side === "buy" ? "text-gain" : "text-loss"}`}>{t.side.toUpperCase()}</td>
                    <td className="num px-4">{fmtNum(t.quantity)}</td>
                    <td className="num px-4">{fmtINR(t.price)}</td>
                    <td className="num px-4">{fmtINR(t.value)}</td>
                    <td className={`num px-4 ${toneClass(Number(t.realized_pnl))}`}>{t.realized_pnl != null ? fmtSigned(t.realized_pnl) : "—"}</td>
                    <td className={`num px-4 ${toneClass(r ?? 0)}`}>{r != null ? fmtPct(r) : "—"}</td>
                    <td className="px-4"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Filled</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
