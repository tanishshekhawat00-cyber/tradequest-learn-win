import { describe, expect, it } from "vitest";
import { getCandles, getIndicators } from "@/lib/trading-charts";
import { priceAt } from "@/lib/market";

describe("Paper trading chart data", () => {
  const now = Date.UTC(2026, 9, 6, 11, 38, 13);
  it("uses the paper trading price for the current candle close", () => {
    const candles = getCandles("TCS", "1D", now);
    expect(candles.at(-1)?.close).toBe(priceAt("TCS", now));
    expect(getCandles("TCS", "1D", now)).toEqual(candles);
    for (const c of candles) {
      expect(c.t).toBeLessThanOrEqual(now);
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
      expect(c.volume).toBeGreaterThanOrEqual(0);
    }
  });
  it("calculates standard moving averages and Bollinger bands", () => {
    const candles = Array.from({ length: 80 }, (_, i) => ({ t: i, open: 100, high: 100, low: 100, close: 100, volume: 1 }));
    const indicators = getIndicators(candles);
    expect(indicators.sma.at(-1)?.value).toBe(100);
    expect(indicators.ema.at(-1)?.value).toBe(100);
    expect(indicators.bands.at(-1)?.value.upper).toBe(100);
    expect(indicators.bands.at(-1)?.value.lower).toBe(100);
    expect(indicators.macd.at(-1)?.value.MACD).toBe(0);
  });
  it("keeps RSI within its standard 0–100 scale", () => {
    const rsi = getIndicators(getCandles("TCS", "1D", now)).rsi;
    expect(rsi.length).toBeGreaterThan(0);
    for (const p of rsi) { expect(p.value).toBeGreaterThanOrEqual(0); expect(p.value).toBeLessThanOrEqual(100); }
  });
});