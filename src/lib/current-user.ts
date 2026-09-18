"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import type { TeamMember } from "./team";

export function useCurrentTeamMember() {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("team_members")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (data && !cancelled) {
          setMember({
            id: data.id,
            name: data.name,
            email: data.email ?? "",
            phone: data.phone ?? "",
            role: data.role,
            active: data.active,
            commissionPct: data.commission_pct != null ? Number(data.commission_pct) : undefined,
            zone: data.zone ?? undefined,
          });
        }
      } catch (err) {
        // Si falla la consulta (red, hipo de la base), no dejamos la
        // pantalla trabada en "Cargando…" para siempre.
        console.error("useCurrentTeamMember:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { member, loading };
}

export type Developer = { id: string; name: string; username?: string };

export function useCurrentDeveloper() {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("developers")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (data && !cancelled) {
          setDeveloper({ id: data.id, name: data.name, username: data.username ?? undefined });
        }
      } catch (err) {
        console.error("useCurrentDeveloper:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { developer, loading };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/admin-login";
}
