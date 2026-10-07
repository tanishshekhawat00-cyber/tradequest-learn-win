import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand";
import { completeOnboarding } from "@/lib/trading.functions";
import { usePortfolioQuery, useRefreshPortfolio } from "@/hooks/use-portfolio";
import { fmtINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: pageMeta("Set up your account — TradeQuest", "Choose your experience level and starting virtual balance for TradeQuest paper trading.") }),
  component: Onboarding,
});

const EXP = [
  { v: "beginner", t: "Beginner", d: "I'm new to investing" },
  { v: "intermediate", t: "Intermediate", d: "I know the basics" },
  { v: "advanced", t: "Advanced", d: "I trade or analyse regularly" },
] as const;
const BAL = [100000, 500000, 1000000];

function Onboarding() {
  const { data } = usePortfolioQuery();
  const refresh = useRefreshPortfolio();
  const navigate = useNavigate();
  const finish = useServerFn(completeOnboarding);
  const [displayName, setDisplayName] = useState(data?.profile.display_name ?? "");
  const [username, setUsername] = useState("");
  const [experience, setExperience] = useState<(typeof EXP)[number]["v"]>("beginner");
  const [balance, setBalance] = useState(100000);
  const [busy, setBusy] = useState(false);
  const validU = /^[a-z0-9_]{3,20}$/.test(username);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validU || !displayName.trim()) return;
    setBusy(true);
    try {
      await finish({ data: { username, displayName, experience, balance } });
      await refresh();
      toast.success("Your virtual portfolio is ready");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid-glow min-h-screen px-4 py-10">
      <form onSubmit={submit} className="mx-auto max-w-xl">
        <Logo />
        <h1 className="mt-10 text-3xl font-semibold">Set up your trading desk</h1>
        <p className="mt-2 text-muted-foreground">Everything here uses virtual money. You can't deposit or lose real funds.</p>

        <section className="mt-8 grid gap-4 rounded-2xl border bg-card p-5">
          <div className="grid gap-2">
            <Label htmlFor="dn">Display name</Label>
            <Input id="dn" required maxLength={50} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="un">Username</Label>
            <Input id="un" required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="e.g. bull_rider" />
            <p className={cn("text-xs", username && !validU ? "text-loss" : "text-muted-foreground")}>3–20 lowercase letters, numbers or underscores.</p>
          </div>
        </section>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Experience level</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {EXP.map((x) => (
            <button type="button" key={x.v} onClick={() => setExperience(x.v)} className={cn("rounded-2xl border bg-card p-4 text-left transition-all", experience === x.v && "border-primary ring-2 ring-primary/30")}>
              <div className="font-semibold">{x.t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{x.d}</div>
            </button>
          ))}
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Starting virtual balance</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {BAL.map((b) => (
            <button type="button" key={b} onClick={() => setBalance(b)} className={cn("relative rounded-2xl border bg-card p-4 text-left transition-all", balance === b && "border-primary ring-2 ring-primary/30")}>
              {balance === b && <Check className="absolute right-3 top-3 size-4 text-primary" />}
              <div className="num text-lg font-semibold">{fmtINR(b, true)}</div>
              <div className="mt-1 text-xs text-muted-foreground">virtual</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Your balance is fixed once chosen, so your returns stay comparable on leaderboards.</p>

        <Button size="lg" className="mt-8 w-full" disabled={busy || !validU || !displayName.trim()}>{busy ? "Setting up…" : "Start paper trading"}</Button>
      </form>
    </div>
  );
}
