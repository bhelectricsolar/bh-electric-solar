-- Proyectos: descripción / alcance y presupuesto en dólares. Idempotente.

alter table projects add column if not exists description text not null default '';
alter table projects add column if not exists budget_usd numeric;
