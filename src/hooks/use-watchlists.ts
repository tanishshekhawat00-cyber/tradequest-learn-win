import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Watchlist = { id: string; name: string; created_at: string; items: { id: string; symbol: string }[] };

export function useWatchlists() {
  return useQuery({
    queryKey: ["watchlists"],
    queryFn: async (): Promise<Watchlist[]> => {
      const { data, error } = await supabase.from("watchlists").select("id, name, created_at, watchlist_items(id, symbol)").order("created_at");
      if (error) throw error;
      return (data ?? []).map((w) => ({ id: w.id, name: w.name, created_at: w.created_at, items: w.watchlist_items ?? [] }));
    },
  });
}

export function useWatchlistMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["watchlists"] });
  const onError = (e: Error) => toast.error(e.message);
  return {
    create: useMutation({
      mutationFn: async (name: string) => {
        const { error } = await supabase.from("watchlists").insert({ name: name.trim().slice(0, 40) });
        if (error) throw error;
      },
      onSuccess: done, onError,
    }),
    rename: useMutation({
      mutationFn: async ({ id, name }: { id: string; name: string }) => {
        const { error } = await supabase.from("watchlists").update({ name: name.trim().slice(0, 40) }).eq("id", id);
        if (error) throw error;
      },
      onSuccess: done, onError,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("watchlists").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: done, onError,
    }),
    add: useMutation({
      mutationFn: async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
        const { error } = await supabase.from("watchlist_items").insert({ watchlist_id: watchlistId, symbol });
        if (error && error.code !== "23505") throw error;
      },
      onSuccess: done, onError,
    }),
    removeItem: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("watchlist_items").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: done, onError,
    }),
  };
}
