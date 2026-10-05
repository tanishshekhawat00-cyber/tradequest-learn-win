export type Theme = "dark" | "light";

export function applyStoredTheme() {
  if (typeof window === "undefined") return;
  const t = (localStorage.getItem("tq-theme") as Theme | null) ?? "dark";
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem("tq-theme", next);
  return next;
}
