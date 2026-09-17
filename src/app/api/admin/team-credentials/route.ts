import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const EMAIL_DOMAIN = "bhelectricsolar.internal";

function toInternalEmail(username: string) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { teamMemberId, username, password } = body as {
    teamMemberId: string;
    username: string;
    password: string;
  };

  if (!teamMemberId || !username || !password) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña tiene que tener al menos 6 caracteres." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: callerDeveloper } = await supabase
    .from("developers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { data: caller } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const isDeveloper = !!callerDeveloper;
  const isSelf = caller?.id === teamMemberId;
  const isAdmin = caller?.role === "admin";
  if (!isDeveloper && !isAdmin && !isSelf) {
    return NextResponse.json({ error: "No tenés permiso para hacer esto." }, { status: 403 });
  }

  const { data: target, error: targetError } = await supabaseAdmin
    .from("team_members")
    .select("id, auth_user_id, username")
    .eq("id", teamMemberId)
    .maybeSingle();
  if (targetError || !target) {
    return NextResponse.json({ error: "No se encontró a esa persona." }, { status: 404 });
  }

  const email = toInternalEmail(username);

  if (target.auth_user_id) {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      target.auth_user_id,
      { email, password },
    );
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  } else {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? "No se pudo crear el usuario." },
        { status: 400 },
      );
    }
    await supabaseAdmin
      .from("team_members")
      .update({ auth_user_id: created.user.id })
      .eq("id", teamMemberId);
  }

  await supabaseAdmin.from("team_members").update({ username: username.trim().toLowerCase() }).eq("id", teamMemberId);

  return NextResponse.json({ ok: true });
}
