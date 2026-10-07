<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Simulated prices come from `src/lib/market.ts` (deterministic per symbol/time) so server fills and UI agree; swap in a real provider behind a server function later.
- All money-moving actions (orders, fills, onboarding balance, XP) run in server functions using the `execute_fill` DB function; clients can only read their own rows via RLS.
- Trading OHLC bars are aggregated from the shared deterministic price provider; technical indicators use a library, and browser chart rendering is dynamically imported after hydration to keep SSR safe.
- Leaf routes use shared metadata generation for titles, descriptions and social tags so page previews stay consistent without exposing account data.
