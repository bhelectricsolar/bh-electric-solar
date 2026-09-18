-- Guarda los planes de cuotas configurables por tarjeta (Configuración →
-- Planes de cuotas), usados como cotizador en Caja → Registrar venta.
-- Idempotente.

alter table store_settings add column if not exists installment_plans jsonb not null default '[]'::jsonb;
