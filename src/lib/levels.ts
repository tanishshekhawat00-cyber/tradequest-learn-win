export const LEVEL_NAMES = ["Beginner", "Rookie", "Trader", "Strategist", "Analyst", "Expert", "Master"];
const THRESHOLDS = [0, 200, 600, 1200, 2200, 3600, 5500];

export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < THRESHOLDS.length && xp >= THRESHOLDS[i + 1]) i++;
  const next = THRESHOLDS[i + 1];
  return {
    index: i,
    name: LEVEL_NAMES[i],
    nextName: LEVEL_NAMES[i + 1],
    progress: next ? ((xp - THRESHOLDS[i]) / (next - THRESHOLDS[i])) * 100 : 100,
    toNext: next ? next - xp : 0,
  };
}
