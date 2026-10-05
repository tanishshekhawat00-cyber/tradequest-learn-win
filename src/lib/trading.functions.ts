import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ASSETS, getAsset, priceAt } from "./market";
import { getLesson } from "./lessons";

const BALANCES = [100000, 500000, 1000000] as const;

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

function shouldFill(o: { side: string; order_type: string; trigger_price: number | null }, price: number) {
  const tp = Number(o.trigger_price);
  switch (o.order_type) {
    case "market":
      return true;
    case "limit":
      return o.side === "buy" ? price <= tp : price >= tp;
    case "stop_loss":
      return price <= tp;
    case "take_profit":
      return price >= tp;
    default:
      return false;
  }
}

async function processPending(admin: Admin, userId: string) {
  const { data: pending } = await admin
    .from("orders")
    .select("id, symbol, side, order_type, trigger_price")
    .eq("user_id", userId)
    .eq("status", "pending");
  const now = Date.now();
  for (const o of pending ?? []) {
    const price = priceAt(o.symbol, now);
    if (shouldFill(o, price)) await admin.rpc("execute_fill", { _order_id: o.id, _price: price });
  }
}

export const getPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await processPending(supabaseAdmin, context.userId);
    const sb = context.supabase;
    const [profile, holdings, pending, trades] = await Promise.all([
      sb.from("profiles").select("*").eq("id", context.userId).single(),
      sb.from("holdings").select("symbol, quantity, avg_price").eq("user_id", context.userId),
      sb.from("orders").select("id, symbol, side, order_type, quantity, trigger_price, created_at").eq("user_id", context.userId).eq("status", "pending").order("created_at", { ascending: false }),
      sb.from("trades").select("id, symbol, side, quantity, price, value, realized_pnl, cost_basis, created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(1000),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    const { count: lessonsDone } = await sb.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", context.userId);
    return {
      profile: profile.data,
      holdings: (holdings.data ?? []).map((h) => ({ ...h, quantity: Number(h.quantity), avg_price: Number(h.avg_price) })),
      pending: (pending.data ?? []).map((o) => ({ ...o, quantity: Number(o.quantity), trigger_price: o.trigger_price == null ? null : Number(o.trigger_price) })),
      trades: (trades.data ?? []).map((t) => ({ ...t, quantity: Number(t.quantity), price: Number(t.price), value: Number(t.value), realized_pnl: t.realized_pnl == null ? null : Number(t.realized_pnl), cost_basis: t.cost_basis == null ? null : Number(t.cost_basis) })),
      lessonsDone: lessonsDone ?? 0,
    };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, "3–20 letters, numbers or underscores"),
      displayName: z.string().trim().min(1).max(50),
      experience: z.enum(["beginner", "intermediate", "advanced"]),
      balance: z.number().refine((b) => (BALANCES as readonly number[]).includes(b), "Invalid starting balance"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("profiles").select("onboarded").eq("id", context.userId).single();
    if (p?.onboarded) throw new Error("Already onboarded");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ username: data.username, display_name: data.displayName, experience: data.experience, starting_balance: data.balance, cash: data.balance, onboarded: true })
      .eq("id", context.userId);
    if (error) throw new Error(error.code === "23505" ? "That username is taken" : error.message);
    await supabaseAdmin.from("watchlists").insert({ user_id: context.userId, name: "My Watchlist" });
    return { ok: true };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      symbol: z.string().refine((s) => ASSETS.some((a) => a.symbol === s), "Unknown asset"),
      side: z.enum(["buy", "sell"]),
      orderType: z.enum(["market", "limit", "stop_loss", "take_profit"]),
      quantity: z.number().int().min(1).max(1_000_000),
      triggerPrice: z.number().positive().max(10_000_000).optional(),
    })
      .refine((o) => o.orderType === "market" || o.triggerPrice != null, "Trigger price required")
      .refine((o) => !["stop_loss", "take_profit"].includes(o.orderType) || o.side === "sell", "Stop-loss and take-profit orders are sell orders")
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const price = priceAt(data.symbol, Date.now());
    if (data.side === "sell") {
      const { data: h } = await supabaseAdmin.from("holdings").select("quantity").eq("user_id", context.userId).eq("symbol", data.symbol).maybeSingle();
      if (!h || Number(h.quantity) < data.quantity) throw new Error("You don't hold enough shares");
    } else if (data.orderType === "market") {
      const { data: p } = await supabaseAdmin.from("profiles").select("cash").eq("id", context.userId).single();
      if (!p || Number(p.cash) < price * data.quantity) throw new Error("Not enough virtual cash");
    }
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({ user_id: context.userId, symbol: data.symbol, side: data.side, order_type: data.orderType, quantity: data.quantity, trigger_price: data.triggerPrice ?? null })
      .select("id, order_type, side, trigger_price")
      .single();
    if (error) throw new Error(error.message);
    if (shouldFill(order, price)) {
      const { data: res, error: e2 } = await supabaseAdmin.rpc("execute_fill", { _order_id: order.id, _price: price });
      if (e2) throw new Error(e2.message);
      if (res === "insufficient_cash") throw new Error("Not enough virtual cash");
      if (res === "insufficient_shares") throw new Error("You don't hold enough shares");
      return { status: "filled" as const, price };
    }
    return { status: "pending" as const, price };
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", data.id).eq("user_id", context.userId).eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lessonId: z.string().max(80), answers: z.array(z.number().int()).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const lesson = getLesson(data.lessonId);
    if (!lesson) throw new Error("Lesson not found");
    const correct = lesson.quiz.filter((q, i) => data.answers[i] === q.answer).length;
    const score = Math.round((correct / lesson.quiz.length) * 100);
    if (score < 50) return { passed: false, score, xp: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("lesson_progress").select("id").eq("user_id", context.userId).eq("lesson_id", lesson.id).maybeSingle();
    if (existing) return { passed: true, score, xp: 0 };
    await supabaseAdmin.from("lesson_progress").insert({ user_id: context.userId, lesson_id: lesson.id, quiz_score: score });
    const { data: p } = await supabaseAdmin.from("profiles").select("xp").eq("id", context.userId).single();
    await supabaseAdmin.from("profiles").update({ xp: (p?.xp ?? 0) + lesson.xp }).eq("id", context.userId);
    return { passed: true, score, xp: lesson.xp };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: holdings }, { data: lessons }, { data: trades }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, username, display_name, avatar_url, xp, starting_balance, cash").eq("onboarded", true).limit(1000),
      supabaseAdmin.from("holdings").select("user_id, symbol, quantity"),
      supabaseAdmin.from("lesson_progress").select("user_id"),
      supabaseAdmin.from("trades").select("user_id, created_at").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);
    const now = Date.now();
    const value: Record<string, number> = {};
    for (const h of holdings ?? []) if (getAsset(h.symbol)) value[h.user_id] = (value[h.user_id] ?? 0) + Number(h.quantity) * priceAt(h.symbol, now);
    const lessonCount: Record<string, number> = {};
    for (const l of lessons ?? []) lessonCount[l.user_id] = (lessonCount[l.user_id] ?? 0) + 1;
    const weekTrades: Record<string, number> = {};
    for (const t of trades ?? []) weekTrades[t.user_id] = (weekTrades[t.user_id] ?? 0) + 1;
    return (profiles ?? []).map((p) => {
      const start = Number(p.starting_balance) || 1;
      const total = Number(p.cash) + (value[p.id] ?? 0);
      return {
        isMe: p.id === context.userId,
        username: p.username ?? "trader",
        displayName: p.display_name ?? p.username ?? "Trader",
        avatarUrl: p.avatar_url,
        xp: p.xp,
        returnPct: ((total - start) / start) * 100,
        lessons: lessonCount[p.id] ?? 0,
        weekTrades: weekTrades[p.id] ?? 0,
      };
    });
  });
