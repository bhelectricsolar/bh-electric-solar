"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import { useLiveRefresh } from "./realtime";

// Avisos minimalistas en el menú: cuánto necesita atención en cada sección,
// para no tener que entrar a mirar. Mismo criterio de "lead frío" que usa
// Inicio.
const LEAD_STALE_DAYS = 3;

export type AdminBadges = Record<string, number>;

export function useAdminBadges() {
  const [badges, setBadges] = useState<AdminBadges>({});

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const [ordersRes, leadsRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "nuevo"),
        supabase.from("customers").select("last_contacted_at,created_at").eq("status", "lead"),
      ]);
      const now = Date.now();
      const staleLeads = (leadsRes.data ?? []).filter(
        (c: { last_contacted_at: string | null; created_at: string }) =>
          (now - new Date(c.last_contacted_at ?? c.created_at).getTime()) / 86400000 >= LEAD_STALE_DAYS,
      ).length;
      setBadges({
        "/admin/pedidos": ordersRes.count ?? 0,
        "/admin/leads": staleLeads,
      });
    } catch (e) {
      console.error("Avisos del menú:", e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveRefresh(["orders", "customers"], load);

  return badges;
}
