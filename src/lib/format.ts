const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export const fmtINR = (v: number, whole = false) => (whole ? inr0 : inr).format(v || 0);
export const fmtNum = (v: number) => num.format(v || 0);
export const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${(v || 0).toFixed(2)}%`;
export const fmtSigned = (v: number) => `${v >= 0 ? "+" : "−"}${inr.format(Math.abs(v || 0))}`;
export const fmtCompact = (v: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v || 0);
export const toneClass = (v: number) => (v > 0 ? "text-gain" : v < 0 ? "text-loss" : "text-muted-foreground");
