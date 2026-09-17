"use client";

import { useEffect, useState } from "react";
import { useCurrentDeveloper } from "@/lib/current-user";
import { getTeam, type TeamMember } from "@/lib/team";

export default function DeveloperPage() {
  const { developer } = useCurrentDeveloper();
  const [owners, setOwners] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeam()
      .then((team) => setOwners(team.filter((m) => m.role === "admin")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-600">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14" />
          </svg>
        </span>
        <div>
          <h1 className="text-lg font-bold text-ink">Panel de desarrollador</h1>
          <p className="text-xs text-body">
            {developer ? `Conectado como ${developer.name}` : "Acceso por encima del dueño y su equipo"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink">Acceso del dueño de BH Electric Solar</h2>
        <p className="mt-1 text-xs text-body">
          Desde acá le asignás (o le reseteás) el usuario y contraseña al dueño. Una vez que entre,
          él mismo le asigna acceso a sus vendedores y técnicos desde Equipo.
        </p>

        {loading && <p className="mt-4 text-xs text-body">Cargando…</p>}

        {!loading && owners.length === 0 && (
          <p className="mt-4 text-xs text-body">No hay ningún miembro con rol de administrador todavía.</p>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {owners.map((owner) => (
            <OwnerCredentialForm key={owner.id} owner={owner} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OwnerCredentialForm({ owner }: { owner: TeamMember }) {
  const [username, setUsername] = useState(owner.username ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/team-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId: owner.id, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setMessage({ ok: true, text: "Acceso guardado." });
      setPassword("");
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Error inesperado." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink">{owner.name}</p>
          <p className="text-xs text-body">{owner.email || "Sin email registrado"}</p>
        </div>
        {owner.username && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            Ya tiene acceso
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-body">Usuario</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej: bruno"
            className="rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none focus:border-violet-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-body">Contraseña nueva</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mínimo 6 caracteres"
            className="rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none focus:border-violet-500"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={saving || !username || !password}
          onClick={save}
          className="cursor-pointer touch-manipulation rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar acceso"}
        </button>
        {message && (
          <span className={`text-xs font-semibold ${message.ok ? "text-emerald-600" : "text-red-500"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
