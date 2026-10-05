import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, BookOpen, History, Home, LineChart, LogOut, Moon, Search, Star, Sun, Trophy, User, Wallet, Flag } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolio } from "@/hooks/use-portfolio";
import { fmtINR } from "@/lib/format";
import { levelFor } from "@/lib/levels";
import { toggleTheme } from "@/lib/theme";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/markets", label: "Markets", icon: Search },
  { to: "/portfolio", label: "Portfolio", icon: Wallet },
  { to: "/history", label: "History", icon: History },
  { to: "/watchlist", label: "Watchlists", icon: Star },
  { to: "/challenges", label: "Challenges", icon: Flag },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/learn", label: "Learn", icon: BookOpen },
] as const;

const MOBILE = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/portfolio", label: "Portfolio", icon: BarChart3 },
  { to: "/challenges", label: "Challenges", icon: Flag },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data, summary } = usePortfolio();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [, force] = useState(0);
  const p = data?.profile;
  const lvl = levelFor(p?.xp ?? 0);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar px-4 py-5 lg:flex">
        <Logo className="px-2" />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground" activeProps={{ className: "!bg-sidebar-accent !text-foreground" }}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/profile" className="rounded-2xl border bg-card p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{lvl.name}</span>
            <span className="num text-muted-foreground">{p?.xp ?? 0} XP</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${lvl.progress}%` }} />
          </div>
          {lvl.nextName && <div className="mt-1.5 text-[11px] text-muted-foreground">{lvl.toNext} XP to {lvl.nextName}</div>}
        </Link>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <Logo className="lg:hidden" />
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Virtual cash</div>
              <div className="num text-sm font-semibold">{summary ? fmtINR(summary.cash) : "—"}</div>
            </div>
            <button aria-label="Toggle theme" onClick={() => { toggleTheme(); force((x) => x + 1); }} className="grid size-9 place-items-center rounded-full border text-muted-foreground hover:text-foreground">
              <Sun className="hidden size-4 dark:block" />
              <Moon className="size-4 dark:hidden" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account menu" className="rounded-full">
                <Avatar className="size-9">
                  {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                  <AvatarFallback>{(p?.display_name ?? p?.username ?? "T").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="font-semibold">{p?.display_name ?? "Trader"}</div>
                  <div className="text-xs font-normal text-muted-foreground">@{p?.username}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><User className="size-4" /> Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}><LogOut className="size-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground" activeProps={{ className: "!text-primary" }}>
            <n.icon className="size-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
