-- Aísla lo que carga el desarrollador (Zentrix, cuenta de prueba) de los
-- datos reales del negocio, en Leads, Clientes, Proyectos y Cotizador —
-- mismo criterio que ya se usa en Caja/Pedidos con team_members.is_dev_account.
-- Idempotente.

-- Clientes/leads: quién lo cargó (nulo = vino solo del formulario público) y
-- una marca manual por si alguien prueba el formulario público y hay que
-- ocultar ese lead de prueba a mano.
alter table customers add column if not exists created_by text references team_members(id) on delete set null;
alter table customers add column if not exists is_test boolean not null default false;
