-- Cotizador solar: lista de equipos y precios manuales (paneles, inversores,
-- baterías, estructura, instalación). Idempotente.

alter table store_settings add column if not exists solar_components jsonb not null default '[]'::jsonb;
