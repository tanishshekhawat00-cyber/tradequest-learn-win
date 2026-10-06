import { BollingerBands, EMA, MACD, RSI, SMA } from "technicalindicators";
import { getAsset, priceAt, RANGE_MS, type Range } from "@/lib/market";

export type Candle = { t: number; open: number; high: number; low: number; close: number; volume: number };
export const CANDLE_INTERVALS: Record<Range, number> = {
  "1D": 5 * 60000, "1W": 30 * 60000, "1M": 4 * 3600000,
  "3M": 12 * 3600000, "6M": 86400000, "1Y": 2 * 86400000, ALL: 7 * 86400000,
};
export const INTERVAL_LABELS: Record<Range, string> = {
  "1D": "5m", "1W": "30m", "1M": "4h", "3M": "12h", "6M": "1d", "1Y": "2d", ALL: "1w",
};

// Aggregate actual samples from the same simulation used for paper order fills.
// The final bar is partial: never sample future prices or future volume.
export function getCandles(symbol: string, range: Range, now: number): Candle[] {
  const asset = getAsset(symbol);
  if (!asset) return [];
  const interval = CANDLE_INTERVALS[range];
  const first = Math.floor((now - RANGE_MS[range]) / interval) * interval;
  const out: Candle[] = [];
  for (let t = first; t <= now; t += interval) {
    const end = Math.min(t + interval, now);
    const samples = Array.from({ length: 13 }, (_, i) => priceAt(symbol, t + (end - t) * i / 12));
    const open = samples[0];
    const close = samples.at(-1);
    if (open === undefined || close === undefined) continue;
    const activity = 0.7 + Math.abs(close - open) / open * 60;
    out.push({ t, open, close, high: Math.max(...samples), low: Math.min(...samples),
      volume: Math.round(asset.volume * (end - t) / 86400000 * activity) });
  }
  return out;
}

export function getIndicators(candles: Candle[]) {
  const values = candles.map((c) => c.close);
  const align = <T,>(data: T[]) => data.map((value, i) => ({ t: candles[candles.length - data.length + i].t, value }));
  return {
    sma: align(SMA.calculate({ period: 20, values })),
    ema: align(EMA.calculate({ period: 50, values })),
    bands: align(BollingerBands.calculate({ period: 20, stdDev: 2, values })),
    rsi: align(RSI.calculate({ period: 14, values })),
    macd: align(MACD.calculate({ values, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false })),
  };
}