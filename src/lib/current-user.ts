"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import type { TeamMember } from "./team";

export function useCurrentTeamMember() {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) {
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
      setLoading(false);
    });
  }, []);

  return { member, loading };
}

export type Developer = { id: string; name: string; username?: string };

export function useCurrentDeveloper() {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("developers")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) {
        setDeveloper({ id: data.id, name: data.name, username: data.username ?? undefined });
      }
      setLoading(false);
    });
  }, []);

  return { developer, loading };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/admin-login";
}
