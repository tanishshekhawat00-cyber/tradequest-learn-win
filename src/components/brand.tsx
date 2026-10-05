import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { fmtPct, toneClass } from "@/lib/format";
import { TrendingDown, TrendingUp } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-display text-lg font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-5 4 4 8-9" />
          <path d="M15 7h5v5" />
        </svg>
      </span>
      TradeQuest
    </Link>
  );
}

export function AssetBadge({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-secondary font-display text-xs font-semibold text-secondary-foreground", className)}>
      {symbol.slice(0, 2)}
    </span>
  );
}

export function ChangePill({ pct, className }: { pct: number; className?: string }) {
  const up = pct >= 0;
  return (
    <span className={cn("num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", up ? "bg-gain/12 text-gain" : "bg-loss/12 text-loss", className)}>
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {fmtPct(pct)}
    </span>
  );
}

export function Stat({ label, value, sub, tone, className }: { label: string; value: string; sub?: string; tone?: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4", className)}>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("num mt-1.5 text-xl font-semibold", tone != null && toneClass(tone))}>{value}</div>
      {sub && <div className={cn("num mt-0.5 text-xs", tone != null ? toneClass(tone) : "text-muted-foreground")}>{sub}</div>}
    </div>
  );
}

export function SimBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-highlight/40 bg-highlight/10 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
      <span className="size-1.5 animate-pulse rounded-full bg-highlight" /> Simulated prices · virtual money
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
