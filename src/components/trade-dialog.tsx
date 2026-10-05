import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { placeOrder } from "@/lib/trading.functions";
import { getAsset, priceAt } from "@/lib/market";
import { fmtINR, fmtNum } from "@/lib/format";
import { usePortfolio, useRefreshPortfolio } from "@/hooks/use-portfolio";
import { cn } from "@/lib/utils";

type OrderType = "market" | "limit" | "stop_loss" | "take_profit";
const LABELS: Record<OrderType, string> = { market: "Market", limit: "Limit", stop_loss: "Stop-loss", take_profit: "Take-profit" };

export function TradeDialog({ symbol, side: initialSide, open, onOpenChange }: { symbol: string; side: "buy" | "sell"; open: boolean; onOpenChange: (o: boolean) => void }) {
  const asset = getAsset(symbol)!;
  const { data, positions, now } = usePortfolio();
  const refresh = useRefreshPortfolio();
  const place = useServerFn(placeOrder);
  const [side, setSide] = useState(initialSide);
  const [type, setType] = useState<OrderType>("market");
  const [qty, setQty] = useState("1");
  const [trigger, setTrigger] = useState("");
  const [busy, setBusy] = useState(false);

  const price = priceAt(symbol, now);
  const held = positions.find((p) => p.symbol === symbol)?.quantity ?? 0;
  const cash = Number(data?.profile.cash ?? 0);
  const q = Math.floor(Number(qty) || 0);
  const execPrice = type === "market" ? price : Number(trigger) || price;
  const estimate = q * execPrice;
  const types: OrderType[] = side === "buy" ? ["market", "limit"] : ["market", "limit", "stop_loss", "take_profit"];
  const err =
    q < 1 ? "Enter a quantity of at least 1"
    : side === "buy" && type === "market" && estimate > cash ? "Not enough virtual cash"
    : side === "sell" && q > held ? `You hold ${fmtNum(held)} shares`
    : type !== "market" && !(Number(trigger) > 0) ? "Enter a trigger price"
    : null;

  const switchSide = (s: "buy" | "sell") => {
    setSide(s);
    if (s === "buy" && (type === "stop_loss" || type === "take_profit")) setType("market");
  };

  async function submit() {
    if (err) return;
    setBusy(true);
    try {
      const res = await place({ data: { symbol, side, orderType: type, quantity: q, triggerPrice: type === "market" ? undefined : Number(trigger) } });
      if (res.status === "filled") toast.success(`${side === "buy" ? "Bought" : "Sold"} ${q} ${symbol} at ${fmtINR(res.price)}`);
      else toast.success(`${LABELS[type]} order placed`, { description: `Will execute when ${symbol} reaches ${fmtINR(Number(trigger))}.` });
      await refresh();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{asset.name}</DialogTitle>
          <DialogDescription className="num">{symbol} · {fmtINR(price)} · simulated order</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
          {(["buy", "sell"] as const).map((s) => (
            <button key={s} onClick={() => switchSide(s)} className={cn("rounded-lg py-2 text-sm font-semibold capitalize transition-colors", side === s ? (s === "buy" ? "bg-gain text-background" : "bg-loss text-background") : "text-muted-foreground")}>
              {s}
            </button>
          ))}
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Order type</Label>
            <Select value={type} onValueChange={(v) => setType(v as OrderType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{LABELS[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className="num" />
            </div>
            {type !== "market" && (
              <div className="grid gap-2">
                <Label htmlFor="trig">{type === "limit" ? "Limit price" : "Trigger price"}</Label>
                <Input id="trig" inputMode="decimal" placeholder={price.toFixed(2)} value={trigger} onChange={(e) => setTrigger(e.target.value.replace(/[^\d.]/g, ""))} className="num" />
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-muted/40 p-3 text-sm">
            <Row k="Estimated value" v={fmtINR(estimate)} />
            <Row k="Available cash" v={fmtINR(cash)} />
            <Row k="Shares held" v={fmtNum(held)} />
          </div>
          {err && q > 0 && <p className="text-sm text-loss">{err}</p>}
          <Button size="lg" disabled={!!err || busy} onClick={submit} className={cn(side === "sell" && "bg-loss text-background hover:bg-loss/90")}>
            {busy ? "Placing…" : `${side === "buy" ? "Buy" : "Sell"} ${q || ""} ${symbol}`}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">Paper trade with virtual money. No real orders are sent.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="num font-medium">{v}</span>
    </div>
  );
}
