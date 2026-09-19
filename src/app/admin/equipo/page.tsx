"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  getTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
  type TeamRole,
} from "@/lib/team";
import { getShippingZones, type ShippingZone } from "@/lib/shipping";
import { getAllOpenSessions, type CashSession } from "@/lib/caja";
import { getOrders, getOrderItemsWithProduct, type Order } from "@/lib/orders";
import { getProducts, type Product } from "@/lib/products";
import { useAdminSettings } from "@/lib/admin-settings";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import Chip from "@/components/admin/Chip";
import StatusBadge, { type StatusTone } from "@/components/admin/StatusBadge";

type DraftMember = {
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  commissionPct: string;
  zone: string;
};

type CredentialsDraft = { username: string; password: string };

const ROLE_TONE: Record<TeamRole, StatusTone> = {
  admin: "negocio",
  vendedor: "gold",
  tecnico: "done",
};

const ROLE_ORDER: TeamRole[] = ["admin", "vendedor", "tecnico"];

export default function AdminEquipoPage() {
  const { formatPrice } = useAdminSettings();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [openSessions, setOpenSessions] = useState<CashSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<TeamRole | "todos">("todos");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftMember>({
    name: "",
    email: "",
    phone: "",
    role: "vendedor",
    commissionPct: "5",
    zone: "",
  });
  const [credentials, setCredentials] = useState<CredentialsDraft>({ username: "", password: "" });
  const [credentialsSaving, setCredentialsSaving] = useState(false);
  const [credentialsMessage, setCredentialsMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function loadAll() {
    return Promise.all([
      getTeam(),
      getShippingZones(),
      getAllOpenSessions(),
      getOrders(),
      getProducts(),
    ]).then(([team, shippingZones, sessions, allOrders, allProducts]) => {
      setMembers(team);
      setZones(shippingZones);
      setOpenSessions(sessions);
      setOrders(allOrders);
      setProducts(allProducts);
    });
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cajaStatus(memberId: string) {
    return openSessions.find((s) => s.openedBy === memberId) ?? null;
  }

  function todaySales(memberId: string) {
    const today = new Date().toDateString();
    const memberOrders = orders.filter(
      (o) => o.soldBy === memberId && new Date(o.createdAt).toDateString() === today,
    );
    const totalUSD = memberOrders.reduce((sum, o) => {
      const items = getOrderItemsWithProduct(o, products);
      return sum + items.reduce((s, i) => s + (i.product?.priceUSD ?? 0) * i.qty, 0);
    }, 0);
    return { count: memberOrders.length, totalUSD };
  }

  const visible = members.filter(
    (m) => roleFilter === "todos" || m.role === roleFilter,
  );

  function openNew() {
    setEditingId(null);
    setDraft({
      name: "",
      email: "",
      phone: "",
      role: "vendedor",
      commissionPct: "5",
      zone: zones[0]?.region ?? "",
    });
    setCredentials({ username: "", password: "" });
    setCredentialsMessage(null);
    setPanelOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditingId(member.id);
    setDraft({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      commissionPct: String(member.commissionPct ?? ""),
      zone: member.zone ?? zones[0]?.region ?? "",
    });
    setCredentials({ username: member.username ?? "", password: "" });
    setCredentialsMessage(null);
    setPanelOpen(true);
  }

  async function saveCredentials() {
    if (!editingId || !credentials.username.trim() || !credentials.password) return;
    setCredentialsSaving(true);
    setCredentialsMessage(null);
    try {
      const res = await fetch("/api/admin/team-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamMemberId: editingId,
          username: credentials.username,
          password: credentials.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCredentialsMessage(data.error ?? "No se pudo guardar el acceso.");
        return;
      }
      setCredentialsMessage("Acceso guardado.");
      setCredentials((prev) => ({ ...prev, password: "" }));
      await loadAll();
    } finally {
      setCredentialsSaving(false);
    }
  }

  async function toggleActive(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const active = !member.active;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, active } : m)));
    await updateTeamMember(id, { active });
  }

  async function handleDelete(id: string) {
    await deleteTeamMember(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setConfirmDeleteId(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;

    const patch = {
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      role: draft.role,
      commissionPct:
        draft.role === "vendedor" && draft.commissionPct
          ? Number(draft.commissionPct)
          : undefined,
      zone: draft.role !== "admin" ? draft.zone : undefined,
    };

    if (editingId) {
      await updateTeamMember(editingId, patch);
      setMembers((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, ...patch } : m)),
      );
    } else {
      const created = await createTeamMember({ active: true, ...patch });
      setMembers((prev) => [created, ...prev]);
    }
    setPanelOpen(false);
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Equipo</h1>
            <p className="mt-1 text-sm text-body">
              {members.length} personas · vendedores, técnicos y administradores.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
          >
            + Agregar persona
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Para darle acceso a alguien, primero guardala acá y después volvé
          a abrirla con &ldquo;Editar&rdquo; — ahí aparece la sección para
          asignarle usuario y contraseña.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando equipo…</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip active={roleFilter === "todos"} onClick={() => setRoleFilter("todos")}>
            Todos ({members.length})
          </Chip>
          {ROLE_ORDER.map((role) => (
            <Chip
              key={role}
              active={roleFilter === role}
              onClick={() => setRoleFilter(role)}
              tone={ROLE_TONE[role]}
            >
              {ROLE_LABELS[role]} ({members.filter((m) => m.role === role).length})
            </Chip>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {visible.map((member) => (
            <div
              key={member.id}
              className={`flex flex-col rounded-xl border border-ink/10 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md ${!member.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{member.name}</p>
                  <div className="mt-1.5">
                    <StatusBadge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role]}</StatusBadge>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(member.id)}
                  className="shrink-0 cursor-pointer touch-manipulation rounded-full border border-ink/15 bg-background px-2.5 py-1 text-[10px] font-semibold text-body shadow-sm hover:bg-cream-200"
                >
                  {member.active ? "Activo" : "Inactivo"}
                </button>
              </div>

              <p className="mt-3 text-xs text-body">{member.email}</p>
              <p className="text-xs text-body">{member.phone}</p>

              {member.role !== "admin" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3 text-xs">
                  <StatusBadge tone={cajaStatus(member.id) ? "done" : "neutral"}>
                    {cajaStatus(member.id) ? "Caja abierta" : "Caja cerrada"}
                  </StatusBadge>
                  {(() => {
                    const { count, totalUSD } = todaySales(member.id);
                    return count > 0 ? (
                      <span className="text-body">
                        Hoy vendió {count} · {formatPrice(totalUSD)}
                      </span>
                    ) : (
                      <span className="text-body">Sin ventas hoy</span>
                    );
                  })()}
                </div>
              )}

              {(member.zone || member.commissionPct !== undefined) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3 text-xs">
                  {member.zone && (
                    <span className="rounded bg-background px-2 py-1 text-body">
                      Zona: {member.zone}
                    </span>
                  )}
                  {member.commissionPct !== undefined && (
                    <span className="font-data rounded bg-background px-2 py-1 text-body">
                      Comisión: {member.commissionPct}%
                    </span>
                  )}
                </div>
              )}

              {confirmDeleteId === member.id ? (
                <div className="mt-auto flex items-center gap-2 border-t border-ink/10 pt-3">
                  <p className="flex-1 text-[11px] font-semibold text-red-500">¿Quitar del equipo?</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="cursor-pointer touch-manipulation rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="cursor-pointer touch-manipulation rounded-lg bg-cream-200 px-3 py-2 text-xs font-semibold text-ink"
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="mt-auto flex gap-2 border-t border-ink/10 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(member)}
                    className="flex-1 cursor-pointer touch-manipulation rounded-lg border border-ink/10 bg-cream-200 py-2 text-xs font-semibold text-ink shadow-sm hover:shadow-md"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(member.id)}
                    className="flex-1 cursor-pointer touch-manipulation rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-xs font-semibold text-red-500 shadow-sm hover:shadow-md"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-body">
              No hay personas con ese rol todavía.
            </p>
          )}
        </div>
      </div>

      {panelOpen && (
        <div data-sheet className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <form
            onSubmit={handleSave}
            className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">
                {editingId ? "Editar persona" : "Nueva persona"}
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Cerrar"
                className="grid h-8 w-8 cursor-pointer touch-manipulation place-items-center rounded-full text-body hover:bg-cream-200 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <Field label="Nombre">
                <input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Ej: Camila Fretes"
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>

              <Field label="Rol">
                <select
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value as TeamRole })}
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                >
                  {ROLE_ORDER.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-body">
                  {ROLE_DESCRIPTIONS[draft.role]}
                </p>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Email">
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
              </div>

              {draft.role !== "admin" && (
                <Field label="Zona de cobertura">
                  <select
                    value={draft.zone}
                    onChange={(e) => setDraft({ ...draft, zone: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.region}>
                        {z.region}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {draft.role === "vendedor" && (
                <Field label="Comisión por venta (%)">
                  <NumberField
                    decimals
                    suffix=" %"
                    value={draft.commissionPct}
                    onValueChange={(v) => setDraft({ ...draft, commissionPct: v })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
              )}
            </div>

            {editingId && (
              <div className="mt-6 rounded-xl border border-ink/10 bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-body">
                  Acceso al sistema
                </p>
                <p className="mt-1 text-[11px] text-body">
                  {credentials.username
                    ? "Ya tiene acceso — podés cambiar su usuario o contraseña acá."
                    : "Todavía no tiene usuario para entrar al sistema."}
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <Field label="Usuario">
                    <input
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="ej: camila"
                      className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2.5 text-sm text-ink"
                    />
                  </Field>
                  <Field label={credentials.username ? "Nueva contraseña" : "Contraseña"}>
                    <input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Al menos 6 caracteres"
                      className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2.5 text-sm text-ink"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={saveCredentials}
                    disabled={credentialsSaving || !credentials.username.trim() || !credentials.password}
                    className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface py-2.5 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {credentialsSaving ? "Guardando…" : "Guardar acceso"}
                  </button>
                  {credentialsMessage && (
                    <p className="text-[11px] text-body">{credentialsMessage}</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="sticky bottom-0 mt-6 rounded-lg bg-navy-900 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              {editingId ? "Guardar cambios" : "Agregar al equipo"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
