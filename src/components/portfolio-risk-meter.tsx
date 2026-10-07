import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { riskScore, type Position, type PendingOrder, type Trade } from "@/lib/portfolio";

export function PortfolioRiskMeter({ positions, cash, pending, trades }: { positions: Position[]; cash: number; pending: PendingOrder[]; trades: Trade[] }) {
  const risk = riskScore(positions, cash, pending, trades);
  const total = cash + positions.reduce((sum, p) => sum + p.value, 0);
  const sectors = new Map<string, number>();
  for (const p of positions) sectors.set(p.asset.sector, (sectors.get(p.asset.sector) ?? 0) + p.value);
  const largestSector = [...sectors].sort((a, b) => b[1] - a[1])[0];
  const sectorPct = largestSector && total > 0 ? largestSector[1] / total * 100 : 0;
  const severity = risk.score >= 55 ? "High" : risk.score >= 30 ? "Moderate" : positions.length ? "Low" : "No exposure";
  const tone = risk.score >= 55 ? "text-loss" : risk.score >= 30 ? "text-chart-3" : "text-gain";
  const factor = (name: string) => {
    const r = risk.reasons.find((r) => r.label === name);
    return r && r.max > 0 ? r.points / r.max * 100 : 0;
  };
  const bars = [
    { label: "Concentration", value: factor("Sector diversification"), note: "Sector diversification contribution" },
    { label: "Volatility", value: factor("Volatility exposure"), note: "Weighted holding volatility contribution" },
    { label: "Cash exposure", value: factor("Market exposure"), note: "Market exposure risk; more cash reduces this contribution" },
    { label: "Position size", value: factor("Position concentration"), note: "Largest holding concentration contribution" },
  ];
  return (
    <section aria-labelledby="portfolio-risk-heading" className="min-w-0 border-t pt-6">
      <div className="flex items-center justify-between">
        <h2 id="portfolio-risk-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio risk</h2>
        <ShieldCheck className="size-4 text-muted-foreground" />
      </div>
      <div className="relative mx-auto mt-4 h-32 w-56">
        <svg viewBox="0 0 224 128" className="h-full w-full" aria-hidden="true">
          <path d="M 22 112 A 90 90 0 0 1 202 112" fill="none" stroke="var(--secondary)" strokeWidth="12" strokeLinecap="round" />
          <path d="M 22 112 A 90 90 0 0 1 202 112" fill="none" stroke={risk.score >= 55 ? "var(--loss)" : risk.score >= 30 ? "var(--chart-3)" : "var(--gain)"} strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray={`${risk.score} 100`} />
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center">
          <div className="num text-3xl font-semibold">{risk.score}<span className="text-base text-muted-foreground"> / 100</span></div>
          <div className={`mt-1 flex items-center justify-center gap-1 text-xs font-semibold uppercase ${tone}`}>
            {risk.score >= 55 && <AlertTriangle className="size-3.5" />} {severity}
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center justify-between gap-3" title={bar.note}>
            <span className="text-xs text-muted-foreground">{bar.label}</span>
            <div role="meter" aria-label={bar.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(bar.value)} className="grid w-28 shrink-0 grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => <span key={i} className={`h-2.5 rounded-sm ${i < Math.round(bar.value / 10) ? bar.value >= 70 ? "bg-loss" : bar.value >= 40 ? "bg-chart-3" : "bg-gain" : "bg-secondary"}`} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t pt-4">
        {sectorPct > 50 && largestSector ? (
          <p className="flex gap-2 text-xs leading-relaxed"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-chart-3" /><span><strong>{Math.round(sectorPct)}% of your portfolio</strong> is invested in one sector: {largestSector[0]}.</span></p>
        ) : <p className="text-xs leading-relaxed text-muted-foreground">{positions.length ? risk.reasons.find((r) => r.points > 0)?.note ?? "Your current holdings have low measured exposure." : "All funds are in virtual cash. No open market exposure."}</p>}
        <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs"><Link to="/portfolio">{risk.score > 0 ? "Fix this" : "Review portfolio"} <ArrowRight className="size-3.5" /></Link></Button>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">Educational estimate · not financial advice</p>
    </section>
  );
}