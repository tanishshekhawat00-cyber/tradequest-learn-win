import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const TABLES = ["profiles", "holdings", "orders", "trades", "watchlists", "watchlist_items", "lesson_progress"] as const;

export const Route = createFileRoute("/api/public/jobs/daily-backup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { backupFolder, uploadCsv, toCsv } = await import("@/lib/google.server");
        const folder = await backupFolder();
        const date = new Date().toISOString().slice(0, 10);
        const counts: Record<string, number> = {};
        for (const t of TABLES) {
          const { data, error } = await supabaseAdmin.from(t).select("*").limit(50000);
          if (error) return Response.json({ error: `${t}: ${error.message}` }, { status: 500 });
          counts[t] = data.length;
          await uploadCsv(`${date}_${t}.csv`, toCsv(data as Record<string, unknown>[]), folder);
        }
        return Response.json({ success: true, counts });
      },
    },
  },
});
