import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { usePortfolioQuery } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { data, isLoading, error, refetch } = usePortfolioQuery();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onboarding = pathname.startsWith("/onboarding");
  const needsOnboarding = data && !data.profile.onboarded;

  useEffect(() => {
    if (needsOnboarding && !onboarding) navigate({ to: "/onboarding", replace: true });
    if (data?.profile.onboarded && onboarding) navigate({ to: "/dashboard", replace: true });
  }, [needsOnboarding, onboarding, data, navigate]);

  if (onboarding) return <Outlet />;
  if (error)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-semibold">We couldn't load your portfolio.</p>
          <button className="mt-3 text-sm text-primary underline" onClick={() => refetch()}>Try again</button>
        </div>
      </div>
    );
  if (isLoading || needsOnboarding)
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
