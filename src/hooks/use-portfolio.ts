import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getPortfolio } from "@/lib/trading.functions";
import { computePositions, summarize } from "@/lib/portfolio";

export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function usePortfolioQuery() {
  const fn = useServerFn(getPortfolio);
  return useQuery({ queryKey: ["portfolio"], queryFn: () => fn(), refetchInterval: 20000 });
}

export function usePortfolio() {
  const q = usePortfolioQuery();
  const now = useNow();
  const derived = useMemo(() => {
    if (!q.data) return null;
    const positions = computePositions(q.data.holdings, now).sort((a, b) => b.value - a.value);
    const summary = summarize(Number(q.data.profile.cash), Number(q.data.profile.starting_balance ?? 0), positions);
    return { positions, summary };
  }, [q.data, now]);
  return { ...q, now, positions: derived?.positions ?? [], summary: derived?.summary };
}

export function useRefreshPortfolio() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["portfolio"] });
}
