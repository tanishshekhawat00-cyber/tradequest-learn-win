import { getAsset, getQuote, priceAt, RANGE_MS, type Range } from "./market";

export type Holding = { symbol: string; quantity: number; avg_price: number };
export type Trade = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  value: number;
  realized_pnl: number | null;
  cost_basis: number | null;
  created_at: string;
};
export type PendingOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  order_type: "market" | "limit" | "stop_loss" | "take_profit";
  quantity: number;
  trigger_price: number | null;
  created_at: string;
};

export function computePositions(holdings: Holding[], now = Date.now()) {
  return holdings.map((h) => {
    const q = getQuote(h.symbol, now);
    const qty = Number(h.quantity);
    const avg = Number(h.avg_price);
    const value = qty * q.price;
    const cost = qty * avg;
    return {
      ...h,
      quantity: qty,
      avg_price: avg,
      asset: getAsset(h.symbol)!,
      quote: q,
      value,
      cost,
      unrealized: value - cost,
      returnPct: cost ? ((value - cost) / cost) * 100 : 0,
      dayChange: qty * q.change,
    };
  });
}
export type Position = ReturnType<typeof computePositions>[number];

export function summarize(cash: number, starting: number, positions: Position[]) {
  const invested = positions.reduce((s, p) => s + p.value, 0);
  const cost = positions.reduce((s, p) => s + p.cost, 0);
  const total = cash + invested;
  const dayPnl = positions.reduce((s, p) => s + p.dayChange, 0);
  return {
    cash,
    invested,
    cost,
    total,
    totalPnl: total - starting,
    totalReturnPct: starting ? ((total - starting) / starting) * 100 : 0,
    dayPnl,
    dayPct: total - dayPnl ? (dayPnl / (total - dayPnl)) * 100 : 0,
    unrealized: invested - cost,
  };
}

export function portfolioSeries(trades: Trade[], starting: number, createdAt: string, range: Range, now = Date.now(), points = 90) {
  const start = Math.max(new Date(createdAt).getTime(), now - RANGE_MS[range]);
  const sorted = [...trades].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const step = Math.max((now - start) / points, 60000);
  const out: { t: number; value: number }[] = [];
  for (let t = start; t <= now + 1; t += step) {
    let cash = starting;
    const qty: Record<string, number> = {};
    for (const tr of sorted) {
      if (+new Date(tr.created_at) > t) break;
      const v = Number(tr.value);
      if (tr.side === "buy") {
        cash -= v;
        qty[tr.symbol] = (qty[tr.symbol] ?? 0) + Number(tr.quantity);
      } else {
        cash += v;
        qty[tr.symbol] = (qty[tr.symbol] ?? 0) - Number(tr.quantity);
      }
    }
    let value = cash;
    for (const [s, q] of Object.entries(qty)) if (q > 0) value += q * priceAt(s, t);
    out.push({ t, value: Math.round(value * 100) / 100 });
  }
  return out;
}

export function riskScore(positions: Position[], cash: number, pending: PendingOrder[], trades: Trade[]) {
  const reasons: { label: string; points: number; max: number; note: string }[] = [];
  const invested = positions.reduce((s, p) => s + p.value, 0);
  const total = invested + cash;
  if (positions.length === 0) {
    return { score: 0, level: "No exposure", reasons: [{ label: "No open positions", points: 0, max: 100, note: "You're fully in virtual cash, so there's no market risk yet." }] };
  }
  const maxW = Math.max(...positions.map((p) => p.value / invested));
  const conc = Math.round(Math.min(1, Math.max(0, (maxW - 0.15) / 0.65)) * 30);
  reasons.push({ label: "Position concentration", points: conc, max: 30, note: `Your largest position is ${(maxW * 100).toFixed(0)}% of invested value.` });

  const sectors = new Set(positions.map((p) => p.asset.sector)).size;
  const div = Math.round(Math.max(0, (5 - sectors) / 4) * 20);
  reasons.push({ label: "Sector diversification", points: div, max: 20, note: `You hold ${sectors} sector${sectors === 1 ? "" : "s"}. 5+ sectors scores best.` });

  const protectedSyms = new Set(pending.filter((o) => o.order_type === "stop_loss").map((o) => o.symbol));
  const unprotected = positions.filter((p) => !protectedSyms.has(p.symbol)).length / positions.length;
  const sl = Math.round(unprotected * 20);
  reasons.push({ label: "Stop-loss usage", points: sl, max: 20, note: `${Math.round((1 - unprotected) * 100)}% of positions have a stop-loss.` });

  const exp = invested / total;
  const ex = Math.round(Math.max(0, (exp - 0.5) / 0.5) * 15);
  reasons.push({ label: "Market exposure", points: ex, max: 15, note: `${(exp * 100).toFixed(0)}% of your portfolio is invested; the rest is cash.` });

  const wVol = positions.reduce((s, p) => s + (p.value / invested) * p.asset.vol, 0);
  const vo = Math.round(Math.min(1, Math.max(0, (wVol - 0.6) / 1)) * 15);
  reasons.push({ label: "Volatility exposure", points: vo, max: 15, note: `Weighted volatility of your holdings is ${wVol.toFixed(2)}× average.` });

  const recent = trades.filter((t) => Date.now() - +new Date(t.created_at) < 7 * 86400000).length;
  if (recent > 25) reasons.push({ label: "Trading frequency", points: 0, max: 0, note: `${recent} trades in 7 days — frequent trading can amplify mistakes.` });

  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
  const level = score < 30 ? "Conservative" : score < 55 ? "Balanced" : score < 75 ? "Aggressive" : "Very high risk";
  return { score, level, reasons };
}

export function tradeStats(trades: Trade[]) {
  const sells = trades.filter((t) => t.side === "sell" && t.realized_pnl != null);
  const wins = sells.filter((t) => Number(t.realized_pnl) > 0);
  const realized = sells.reduce((s, t) => s + Number(t.realized_pnl), 0);
  return { count: trades.length, closed: sells.length, wins: wins.length, winRate: sells.length ? (wins.length / sells.length) * 100 : 0, realized };
}
