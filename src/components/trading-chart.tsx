import { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickChart, ChartNoAxesCombined, ChartArea, ChartLine, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RangeTabs } from "@/components/price-chart";
import { getCandles, getIndicators, INTERVAL_LABELS, type Candle } from "@/lib/trading-charts";
import { type Range } from "@/lib/market";
import { fmtCompact, fmtINR } from "@/lib/format";
import type { IChartApi, UTCTimestamp } from "lightweight-charts";

type Mode = "candles" | "ohlc" | "line" | "area";
export function TradingChart({ symbol, now, range, onRangeChange }: { symbol: string; now: number; range: Range; onRangeChange: (r: Range) => void }) {
  const [mode, setMode] = useState<Mode>("candles");
  const [sma, setSma] = useState(true);
  const [ema, setEma] = useState(false);
  const [bands, setBands] = useState(false);
  const [volume, setVolume] = useState(true);
  const [oscillator, setOscillator] = useState<"none" | "rsi" | "macd">("rsi");
  const [hover, setHover] = useState<Candle | null>(null);
  const [error, setError] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candles = useMemo(() => getCandles(symbol, range, now), [symbol, range, now]);
  const dataRef = useRef(candles);
  dataRef.current = candles;
  const updateRef = useRef<((data: Candle[]) => void) | null>(null);
  const visible = hover ?? candles.at(-1);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    setError(false);
    setHover(null);
    void import("lightweight-charts").then((lc) => {
      if (disposed || !container.current) return;
      const root = container.current;
      const color = (name: string) => {
        const probe = document.createElement("span");
        probe.style.color = `var(--${name})`;
        root.appendChild(probe);
        const result = getComputedStyle(probe).color;
        probe.remove();
        // Chart library accepts sRGB, while the design system uses OKLCH.
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.fillStyle = result;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${(a ?? 255) / 255})`;
      };
      const gain = color("gain"), loss = color("loss"), primary = color("primary"), grid = color("border");
      const chart = lc.createChart(root, {
        localization: { locale: "en-IN" },
        autoSize: true, layout: { background: { type: lc.ColorType.Solid, color: color("card") }, textColor: color("muted-foreground"), attributionLogo: true },
        grid: { vertLines: { color: grid }, horzLines: { color: grid } },
        rightPriceScale: { borderColor: grid }, timeScale: { borderColor: grid, timeVisible: range === "1D" || range === "1W", secondsVisible: false },
        crosshair: { mode: lc.CrosshairMode.Normal },
      });
      chartRef.current = chart;
      cleanup = () => { updateRef.current = null; chartRef.current = null; chart.remove(); };
      const priceOptions = { upColor: gain, downColor: loss, borderVisible: false, wickUpColor: gain, wickDownColor: loss, priceFormat: { type: "price" as const, precision: 2, minMove: 0.01 } };
      const price = mode === "candles" ? chart.addSeries(lc.CandlestickSeries, priceOptions)
        : mode === "ohlc" ? chart.addSeries(lc.BarSeries, priceOptions)
        : mode === "line" ? chart.addSeries(lc.LineSeries, { color: primary, lineWidth: 2 })
        : chart.addSeries(lc.AreaSeries, { lineColor: primary, topColor: grid, bottomColor: color("card"), lineWidth: 2 });
      const line = (token: string, pane = 0) => chart.addSeries(lc.LineSeries, { color: color(token), lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
      const smaSeries = sma ? line("chart-2") : null;
      const emaSeries = ema ? line("chart-3") : null;
      const bandSeries = bands ? [line("chart-5"), line("chart-5"), line("chart-5")] : [];
      const volumes = volume ? chart.addSeries(lc.HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1) : null;
      const pane = volume ? 2 : 1;
      const rsiSeries = oscillator === "rsi" ? line("chart-4", pane) : null;
      if (rsiSeries) for (const level of [30, 70]) rsiSeries.createPriceLine({ price: level, color: grid, lineWidth: 1, lineStyle: lc.LineStyle.Dashed, axisLabelVisible: true, title: String(level) });
      const macdSeries = oscillator === "macd" ? line("chart-2", pane) : null;
      const signalSeries = oscillator === "macd" ? line("chart-3", pane) : null;
      const histogram = oscillator === "macd" ? chart.addSeries(lc.HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane) : null;
      const time = (t: number) => Math.floor(t / 1000) as UTCTimestamp;
      const update = (data: Candle[]) => {
        if (mode === "candles" || mode === "ohlc") price.setData(data.map((c) => ({ ...c, time: time(c.t) })));
        else price.setData(data.map((c) => ({ time: time(c.t), value: c.close })));
        const indicators = getIndicators(data);
        smaSeries?.setData(indicators.sma.map((p) => ({ time: time(p.t), value: p.value })));
        emaSeries?.setData(indicators.ema.map((p) => ({ time: time(p.t), value: p.value })));
        bandSeries.forEach((s, i) => s.setData(indicators.bands.map((p) => ({ time: time(p.t), value: i === 0 ? p.value.upper : i === 1 ? p.value.middle : p.value.lower }))));
        volumes?.setData(data.map((c) => ({ time: time(c.t), value: c.volume, color: c.close >= c.open ? gain : loss })));
        rsiSeries?.setData(indicators.rsi.map((p) => ({ time: time(p.t), value: p.value })));
        macdSeries?.setData(indicators.macd.filter((p) => p.value.MACD !== undefined).map((p) => ({ time: time(p.t), value: p.value.MACD ?? 0 })));
        signalSeries?.setData(indicators.macd.filter((p) => p.value.signal !== undefined).map((p) => ({ time: time(p.t), value: p.value.signal ?? 0 })));
        histogram?.setData(indicators.macd.filter((p) => p.value.histogram !== undefined).map((p) => ({ time: time(p.t), value: p.value.histogram ?? 0, color: (p.value.histogram ?? 0) >= 0 ? gain : loss })));
      };
      updateRef.current = update;
      update(dataRef.current);
      chart.panes().forEach((p, i) => p.setStretchFactor(i === 0 ? 5 : 1.3));
      chart.timeScale().fitContent();
      chart.subscribeCrosshairMove((p) => setHover(typeof p.time === "number" ? dataRef.current.find((c) => time(c.t) === p.time) ?? null : null));
      const observer = new MutationObserver(() => {
        chart.applyOptions({ layout: { background: { type: lc.ColorType.Solid, color: color("card") }, textColor: color("muted-foreground") } });
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      cleanup = () => { observer.disconnect(); updateRef.current = null; chartRef.current = null; chart.remove(); };
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; cleanup?.(); };
  }, [symbol, range, mode, sma, ema, bands, volume, oscillator]);
  useEffect(() => { updateRef.current?.(candles); }, [candles]);

  const zoom = (factor: number) => {
    const scale = chartRef.current?.timeScale();
    const view = scale?.getVisibleLogicalRange();
    if (!view || !scale) return;
    const center = (view.from + view.to) / 2, half = (view.to - view.from) / 2 * factor;
    scale.setVisibleLogicalRange({ from: center - half, to: center + half });
  };
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
      <div className="flex items-center gap-1" aria-label="Chart type">
        {([{ id: "candles", label: "Candlestick", icon: CandlestickChart }, { id: "ohlc", label: "OHLC bars", icon: ChartNoAxesCombined }, { id: "line", label: "Line", icon: ChartLine }, { id: "area", label: "Area", icon: ChartArea }] as const).map((m) => <Button key={m.id} size="icon" variant={mode === m.id ? "secondary" : "ghost"} title={m.label} aria-label={m.label} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}><m.icon /></Button>)}
        <span className="ml-2 text-xs text-muted-foreground">{INTERVAL_LABELS[range]}</span>
      </div>
      <div className="max-w-full overflow-x-auto"><RangeTabs value={range} onChange={onRangeChange} /></div>
    </div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      {([{ label: "SMA 20", active: sma, toggle: setSma, color: "text-chart-2" }, { label: "EMA 50", active: ema, toggle: setEma, color: "text-chart-3" }, { label: "Bollinger", active: bands, toggle: setBands, color: "text-chart-5" }, { label: "Volume", active: volume, toggle: setVolume, color: "text-foreground" }]).map((item) => <label key={item.label} className={`flex items-center gap-1.5 ${item.color}`}><input type="checkbox" checked={item.active} onChange={(e) => item.toggle(e.target.checked)} className="accent-primary" />{item.label}</label>)}
      <label className="flex items-center gap-2 text-muted-foreground">Indicator <select aria-label="Momentum indicator" value={oscillator} onChange={(e) => setOscillator(e.target.value as typeof oscillator)} className="rounded-md border bg-card px-2 py-1 text-foreground"><option value="none">None</option><option value="rsi">RSI 14</option><option value="macd">MACD 12/26/9</option></select></label>
    </div>
    <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 text-xs" aria-live="off">
      {visible && <>{([['O', visible.open], ['H', visible.high], ['L', visible.low], ['C', visible.close]] as const).map(([label, value]) => <span key={label} className="text-muted-foreground">{label} <span className="num text-foreground">{fmtINR(value)}</span></span>)}<span className="text-muted-foreground">Vol <span className="num text-foreground">{fmtCompact(visible.volume)}</span></span></>}
    </div>
    <div ref={container} className="h-[480px] w-full overflow-hidden" aria-label={`${symbol} ${mode} chart with ${oscillator} indicator`} />
    {error && <p role="alert" className="text-sm text-loss">Chart could not load. Refresh to try again.</p>}
    <div className="flex items-center justify-between gap-2 border-t pt-2">
      <span className="text-xs text-muted-foreground">{volume ? "Volume · " : ""}{oscillator === "rsi" ? "RSI 14 · 30 / 70" : oscillator === "macd" ? "MACD · Signal · Histogram" : "Price"}</span>
      <div className="flex"><Button size="icon" variant="ghost" title="Zoom in" aria-label="Zoom in" onClick={() => zoom(0.8)}><ZoomIn /></Button><Button size="icon" variant="ghost" title="Zoom out" aria-label="Zoom out" onClick={() => zoom(1.25)}><ZoomOut /></Button><Button size="icon" variant="ghost" title="Reset chart view" aria-label="Reset chart view" onClick={() => chartRef.current?.timeScale().fitContent()}><RotateCcw /></Button></div>
    </div>
  </div>;
}