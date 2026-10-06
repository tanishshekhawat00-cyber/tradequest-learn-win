import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { fmtINR } from "@/lib/format";
import { RANGES, type Range } from "@/lib/market";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function RangeTabs({ value, onChange, ranges = RANGES }: { value: Range; onChange: (r: Range) => void; ranges?: readonly Range[] }) {
  return (
    <div className="inline-flex max-w-full gap-0.5 rounded-full bg-secondary p-1">
      {ranges.map((r) => (
        <Button
          key={r}
          variant="ghost"
          size="sm"
          aria-pressed={value === r}
          onClick={() => onChange(r)}
          className={cn("h-7 shrink-0 rounded-full px-2.5 text-xs font-medium transition-colors", value === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {r}
        </Button>
      ))}
    </div>
  );
}

export function PriceChart({ data, range, height = 260, positive = true }: { data: { t: number; v: number }[]; range: Range; height?: number; positive?: boolean }) {
  const color = positive ? "var(--gain)" : "var(--loss)";
  const id = positive ? "pc-up" : "pc-down";
  const fmt = range === "1D" ? "HH:mm" : range === "1W" ? "EEE HH:mm" : "d MMM";
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="num font-semibold">{fmtINR(payload[0].value as number)}</div>
                  <div className="text-muted-foreground">{format(new Date(payload[0].payload.t), fmt)}</div>
                </div>
              ) : null
            }
          />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 28 - 1}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-20">
      <polyline points={pts} fill="none" stroke={positive ? "var(--gain)" : "var(--loss)"} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
