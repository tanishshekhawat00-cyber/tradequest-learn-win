import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, BookOpen, Bot, Flag, ShieldCheck, Trophy, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradeQuest — Learn Trading. Practice Risk-Free. Compete." },
      { name: "description", content: "Paper trade with virtual money, learn investing fundamentals, take challenges and climb leaderboards. No real money involved." },
      { property: "og:title", content: "TradeQuest — Learn Trading. Practice Risk-Free. Compete." },
      { property: "og:description", content: "A paper-trading simulator and trading education platform. No real money involved." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { i: Wallet, t: "Paper trading", d: "Market, limit, stop-loss and take-profit orders on simulated prices." },
  { i: Bot, t: "AI trading coach", d: "QuestCoach explains your mistakes and teaches concepts. Coming soon." },
  { i: Flag, t: "Challenges", d: "Daily, weekly and monthly goals that build good habits." },
  { i: Trophy, t: "Leaderboards", d: "Ranked by return % and learning — never by raw virtual money." },
  { i: BarChart3, t: "Portfolio analytics", d: "Allocation, sector exposure, P&L breakdown and a 0–100 risk score." },
  { i: BookOpen, t: "Learning center", d: "15 bite-sized lessons with examples, quizzes and XP." },
  { i: Users, t: "Community", d: "Follow friends and share achievements. Coming soon." },
  { i: ShieldCheck, t: "Zero risk", d: "No deposits, no withdrawals, no brokerage connection." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex gap-2"><Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button><Button asChild><Link to="/auth">Get started</Link></Button></div>
      </header>
      <section className="grid-glow border-y">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="text-sm font-medium text-primary">Paper trading · ₹ virtual money</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">Learn Trading. Practice Risk-Free. Compete.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Start with a virtual portfolio of up to ₹10,00,000, trade simulated markets, learn the concepts behind every move and see how you stack up.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/auth">Start Paper Trading</Link></Button><Button asChild size="lg" variant="outline"><a href="#features">Explore Features</a></Button></div>
          <p className="mt-6 text-sm text-muted-foreground">TradeQuest is a simulation and educational platform. No real money is involved.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Pick a virtual starting balance", "Trade simulated stocks with real order types", "Learn, take challenges and climb the ranks"].map((s, i) => (
            <div key={s} className="rounded-3xl border bg-card p-6"><span className="num text-3xl font-semibold text-primary">0{i + 1}</span><p className="mt-3 font-medium">{s}</p></div>
          ))}
        </div>
      </section>
      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-semibold">Everything you need to practise</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => <div key={f.t} className="rounded-3xl border bg-card p-6"><f.i className="size-5 text-primary" /><h3 className="mt-4 font-semibold">{f.t}</h3><p className="mt-1 text-sm text-muted-foreground">{f.d}</p></div>)}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-semibold">Pricing</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6"><h3 className="font-semibold">Free</h3><p className="num mt-2 text-3xl font-semibold">₹0</p><p className="mt-3 text-sm text-muted-foreground">Paper trading, portfolio, challenges, leaderboard and the learning center.</p><Button asChild className="mt-6"><Link to="/auth">Start free</Link></Button></div>
          <div className="rounded-3xl border border-primary bg-card p-6"><h3 className="font-semibold">Pro</h3><p className="mt-2 text-3xl font-semibold">Coming soon</p><p className="mt-3 text-sm text-muted-foreground">QuestCoach AI, advanced analytics, historical simulations and private competitions.</p></div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-3xl font-semibold">FAQ</h2>
        <Accordion type="single" collapsible className="mt-6">
          {[["Is any real money involved?", "No. All balances are virtual and you cannot deposit or withdraw funds."], ["Are prices real?", "Prices are simulated for practice. The app is built so a licensed market-data provider can be connected later."], ["Is this financial advice?", "No. TradeQuest is educational only."]].map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">TradeQuest is a simulation and educational platform. No real money is involved.</footer>
    </div>
  );
}
