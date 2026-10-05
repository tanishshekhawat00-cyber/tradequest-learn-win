import type { Position, Trade, PendingOrder } from "./portfolio";

export type ChallengeInput = {
  returnPct: number;
  positions: Position[];
  trades: Trade[];
  pending: PendingOrder[];
  lessonsDone: number;
  createdAt: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  cadence: "Daily" | "Weekly" | "Monthly";
  rewardXp: number;
  progress: (i: ChallengeInput) => { current: number; target: number; label: string };
  endsAt: (now: number) => number;
};

const endOfDay = (now: number) => { const d = new Date(now); d.setHours(23, 59, 59, 999); return d.getTime(); };
const endOfWeek = (now: number) => { const d = new Date(endOfDay(now)); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); return d.getTime(); };
const endOfMonth = (now: number) => { const d = new Date(now); return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime(); };
const since = (trades: Trade[], ms: number) => trades.filter((t) => +new Date(t.created_at) >= ms);

export const CHALLENGES: Challenge[] = [
  {
    id: "grow-5", title: "Grow your portfolio by 5%", description: "Reach a total return of +5% on your virtual starting balance.", cadence: "Monthly", rewardXp: 300,
    progress: (i) => ({ current: Math.max(0, i.returnPct), target: 5, label: `${i.returnPct.toFixed(2)}% / 5%` }), endsAt: endOfMonth,
  },
  {
    id: "five-sectors", title: "Five-sector portfolio", description: "Hold positions in at least 5 different sectors at the same time.", cadence: "Weekly", rewardXp: 200,
    progress: (i) => { const n = new Set(i.positions.map((p) => p.asset.sector)).size; return { current: n, target: 5, label: `${n} / 5 sectors` }; }, endsAt: endOfWeek,
  },
  {
    id: "five-lessons", title: "Complete 5 lessons", description: "Finish 5 lessons in the Learning Center and pass their quizzes.", cadence: "Weekly", rewardXp: 150,
    progress: (i) => ({ current: i.lessonsDone, target: 5, label: `${i.lessonsDone} / 5 lessons` }), endsAt: endOfWeek,
  },
  {
    id: "protect", title: "Protect your positions", description: "Have an active stop-loss on at least 3 holdings.", cadence: "Weekly", rewardXp: 150,
    progress: (i) => { const n = new Set(i.pending.filter((o) => o.order_type === "stop_loss").map((o) => o.symbol)).size; return { current: n, target: 3, label: `${n} / 3 protected` }; }, endsAt: endOfWeek,
  },
  {
    id: "daily-3", title: "Daily practice", description: "Place 3 simulated trades today.", cadence: "Daily", rewardXp: 50,
    progress: (i) => { const d = new Date(); d.setHours(0, 0, 0, 0); const n = since(i.trades, d.getTime()).length; return { current: n, target: 3, label: `${n} / 3 trades` }; }, endsAt: endOfDay,
  },
];
