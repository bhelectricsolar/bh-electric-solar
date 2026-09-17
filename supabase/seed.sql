-- BH Electric Solar — datos de ejemplo iniciales
-- Ejecutar una sola vez, después de schema.sql

insert into categories (value, label) values
  ('paneles', 'Paneles solares'),
  ('inversores', 'Inversores'),
  ('baterias', 'Baterías'),
  ('estructuras', 'Estructuras de montaje'),
  ('accesorios', 'Accesorios');

insert into shipping_zones (id, region, provinces, price_usd, eta_days) values
  ('retiro-local', 'Retiro en el local', 'Sin envío — el cliente pasa a buscarlo', 0, 'Al momento'),
  ('nea', 'NEA / Litoral', 'Misiones, Corrientes, Chaco, Formosa', 15, '2-4 días'),
  ('amba', 'AMBA', 'CABA, Gran Buenos Aires', 25, '3-5 días'),
  ('centro', 'Centro', 'Córdoba, Santa Fe, Entre Ríos, La Pampa', 22, '3-5 días'),
  ('cuyo', 'Cuyo', 'Mendoza, San Juan, San Luis', 32, '4-6 días'),
  ('noa', 'NOA', 'Salta, Jujuy, Tucumán, Catamarca, La Rioja, Santiago', 30, '4-6 días'),
  ('patagonia', 'Patagonia', 'Neuquén, Río Negro, Chubut, Santa Cruz, Tierra del Fuego', 45, '5-8 días');

insert into products (id, slug, name, category, price_usd, cost_usd, stock, short_description, description, specs, gradient, published_online) values
  ('panel-550w', 'panel-solar-monocristalino-550w', 'Panel Solar Monocristalino 550W', 'paneles', 145, 92, 24,
   'Alta eficiencia para instalaciones residenciales y comerciales.',
   'Panel fotovoltaico monocristalino de 550W, pensado para maximizar la generación en superficies limitadas. Buen desempeño en condiciones de baja radiación y alta durabilidad frente a la intemperie.',
   '[{"label":"Potencia","value":"550 W"},{"label":"Tecnología","value":"Monocristalino PERC"},{"label":"Eficiencia","value":"≈ 21.3%"},{"label":"Garantía de producto","value":"12 años"},{"label":"Garantía de rendimiento","value":"25 años (linear)"},{"label":"Dimensiones","value":"2278 × 1134 × 35 mm"}]'::jsonb,
   'from-[#1d3474] to-[#0a1733]', true),
  ('panel-450w', 'panel-solar-monocristalino-450w', 'Panel Solar Monocristalino 450W', 'paneles', 120, 76, 31,
   'Formato compacto, ideal para techos con espacio reducido.',
   'Panel de 450W en formato más compacto que el de 550W, pensado para techos residenciales con superficie limitada o instalaciones que requieren paneles más livianos y fáciles de manipular.',
   '[{"label":"Potencia","value":"450 W"},{"label":"Tecnología","value":"Monocristalino PERC"},{"label":"Eficiencia","value":"≈ 20.9%"},{"label":"Garantía de producto","value":"12 años"},{"label":"Garantía de rendimiento","value":"25 años (linear)"},{"label":"Dimensiones","value":"1909 × 1134 × 30 mm"}]'::jsonb,
   'from-[#2a4a8a] to-[#0c1a38]', true),
  ('inversor-hibrido-5kw', 'inversor-hibrido-5kw', 'Inversor Híbrido 5kW', 'inversores', 950, 640, 9,
   'Compatible con batería para respaldo ante cortes de red.',
   'Inversor híbrido de 5kW que permite incorporar baterías de litio para seguir generando energía durante un corte de suministro. Gestiona automáticamente la prioridad entre autoconsumo, carga de batería e inyección a red.',
   '[{"label":"Potencia nominal","value":"5000 W"},{"label":"Tipo","value":"Híbrido (on-grid + batería)"},{"label":"Eficiencia máxima","value":"≈ 97.6%"},{"label":"Entradas MPPT","value":"2"},{"label":"Comunicación","value":"WiFi / monitoreo remoto"},{"label":"Garantía","value":"10 años"}]'::jsonb,
   'from-[#12274d] to-[#081127]', true),
  ('inversor-ongrid-3kw', 'inversor-on-grid-3kw', 'Inversor On-Grid 3kW', 'inversores', 480, 315, 14,
   'Solución simple y económica para sistemas conectados a red.',
   'Inversor on-grid de 3kW para instalaciones sin batería, conectadas directamente a la red eléctrica. Buena relación costo-beneficio para proyectos residenciales de autoconsumo.',
   '[{"label":"Potencia nominal","value":"3000 W"},{"label":"Tipo","value":"On-grid"},{"label":"Eficiencia máxima","value":"≈ 97.1%"},{"label":"Entradas MPPT","value":"1"},{"label":"Comunicación","value":"WiFi / monitoreo remoto"},{"label":"Garantía","value":"10 años"}]'::jsonb,
   'from-[#1a3568] to-[#0a1733]', true),
  ('bateria-litio-5kwh', 'bateria-litio-5kwh', 'Batería de Litio 5kWh', 'baterias', 1450, 980, 6,
   'Respaldo de energía para uso nocturno o cortes de suministro.',
   'Batería de litio (LiFePO4) de 5kWh de capacidad utilizable, compatible con inversores híbridos. Permite almacenar el excedente de generación diurna para usarlo de noche o durante un corte de red.',
   '[{"label":"Capacidad","value":"5 kWh utilizables"},{"label":"Química","value":"LiFePO4 (litio-ferrofosfato)"},{"label":"Ciclos de vida","value":"≥ 6000 ciclos"},{"label":"Profundidad de descarga","value":"≈ 95%"},{"label":"Apilable","value":"Sí, hasta 4 unidades"},{"label":"Garantía","value":"10 años"}]'::jsonb,
   'from-[#0f1f45] to-[#081127]', true),
  ('estructura-chapa-x10', 'estructura-montaje-techo-chapa-x10', 'Estructura de Montaje — Techo de Chapa (x10 paneles)', 'estructuras', 280, 175, 12,
   'Kit completo de fijación para techos de chapa trapezoidal.',
   'Kit de estructura de aluminio y acero inoxidable para la fijación de hasta 10 paneles sobre techos de chapa trapezoidal. Incluye ganchos, rieles y tornillería con tratamiento anticorrosivo.',
   '[{"label":"Capacidad","value":"10 paneles"},{"label":"Material","value":"Aluminio + acero inoxidable"},{"label":"Tipo de techo","value":"Chapa trapezoidal"},{"label":"Resistencia al viento","value":"≥ 150 km/h"},{"label":"Incluye","value":"Rieles, ganchos y tornillería"},{"label":"Garantía","value":"15 años"}]'::jsonb,
   'from-[#4a4f63] to-[#171b2c]', true),
  ('cable-solar-6mm', 'cable-solar-6mm-rollo-100m', 'Cable Solar 6mm² — Rollo 100m', 'accesorios', 95, 58, 18,
   'Cable unipolar resistente a UV, apto para exterior.',
   'Cable solar fotovoltaico de 6mm² en rollo de 100 metros, con aislación resistente a rayos UV y variaciones de temperatura. Uso estándar en la conexión entre paneles e inversor.',
   '[{"label":"Sección","value":"6 mm²"},{"label":"Longitud","value":"100 m (rollo)"},{"label":"Resistencia UV","value":"Sí, apto exterior"},{"label":"Tensión máxima","value":"1.5 kV DC"},{"label":"Color","value":"Negro"}]'::jsonb,
   'from-[#6b5a3a] to-[#241d0f]', true),
  ('conectores-mc4', 'kit-conectores-mc4-par', 'Kit de Conectores MC4 (par)', 'accesorios', 8, 5, 60,
   'Conectores estándar macho/hembra para cableado solar.',
   'Par de conectores MC4 (macho y hembra), el estándar de la industria para la conexión segura entre paneles solares y cableado. Resistentes a la intemperie y con certificación IP67.',
   '[{"label":"Tipo","value":"MC4 macho + hembra"},{"label":"Protección","value":"IP67"},{"label":"Corriente máxima","value":"30 A"},{"label":"Tensión máxima","value":"1.5 kV DC"}]'::jsonb,
   'from-[#5c6e46] to-[#1e2a1a]', true),
  ('cinta-autofusionante', 'cinta-autofusionante-empalmes', 'Cinta autofusionante para empalmes', 'accesorios', 6, 3, 40,
   'Material interno para sellado de empalmes en obra.',
   'Cinta autofusionante de uso interno para el equipo de instalación — sellado de empalmes de cable en obra. No se vende suelta al público, se usa como insumo de instalación.',
   '[{"label":"Uso","value":"Insumo interno de instalación"},{"label":"Resistencia UV","value":"Sí"}]'::jsonb,
   'from-[#3a4a3a] to-[#161f16]', false),
  ('panel-550w-reacondicionado', 'panel-550w-reacondicionado', 'Panel Solar 550W — reacondicionado (stock interno)', 'paneles', 95, 40, 3,
   'Unidad reacondicionada, pendiente de inspección para reventa.',
   'Panel devuelto/reacondicionado en revisión técnica. Todavía no se publica en la tienda hasta confirmar que cumple los estándares de reventa.',
   '[{"label":"Potencia","value":"550 W"},{"label":"Estado","value":"Reacondicionado — en revisión"}]'::jsonb,
   'from-[#4a3a1d] to-[#1f1708]', false);

insert into customers (id, name, email, phone, city, status, source, created_at) values
  ('c1', 'Cliente de ejemplo 1', 'ejemplo1@correo.com', '+54 9 3754 000001', 'Posadas, Misiones', 'cliente', 'Calculadora', '2026-08-14'),
  ('c2', 'Cliente de ejemplo 2', 'ejemplo2@correo.com', '+54 9 3754 000002', 'Eldorado, Misiones', 'lead', 'Formulario', '2026-08-22'),
  ('c3', 'Cliente de ejemplo 3', 'ejemplo3@correo.com', '+54 9 3755 000003', 'Oberá, Misiones', 'lead', 'WhatsApp', '2026-09-02'),
  ('c4', 'Cliente de ejemplo 4', 'ejemplo4@correo.com', '+54 9 3754 000004', 'Puerto Iguazú, Misiones', 'cliente', 'Tienda', '2026-09-10');

insert into team_members (id, name, email, phone, role, active, commission_pct, zone) values
  ('team-1', 'Bruno Herrera', 'bruno@bhelectricsolar.com', '+54 9 3754 419198', 'admin', true, null, null),
  ('team-2', 'Camila Fretes', 'camila@bhelectricsolar.com', '+54 9 3754 555111', 'vendedor', true, 5, 'AMBA'),
  ('team-3', 'Lautaro Ibáñez', 'lautaro@bhelectricsolar.com', '+54 9 3755 444222', 'vendedor', true, 4, 'NEA / Litoral'),
  ('team-4', 'Rodrigo Acosta', 'rodrigo@bhelectricsolar.com', '+54 9 3754 333999', 'tecnico', true, null, 'NEA / Litoral');

insert into orders (id, customer_name, customer_phone, customer_city, shipping_zone_id, status, payment_method, origin, created_at) values
  ('P-1001', 'Cliente de ejemplo 4', '+54 9 3754 000004', 'Puerto Iguazú, Misiones', 'nea', 'en_proceso', 'transferencia', 'tienda', '2026-09-10'),
  ('P-1002', 'Cliente de ejemplo 1', '+54 9 3754 000001', 'Posadas, Misiones', 'nea', 'completado', 'efectivo', 'tienda', '2026-08-20'),
  ('P-1003', 'Cliente de ejemplo 3', '+54 9 3755 000003', 'Oberá, Misiones', 'nea', 'nuevo', 'efectivo', 'tienda', '2026-09-11'),
  ('P-1004', 'Cliente de ejemplo 2', '+54 9 3754 000002', 'Eldorado, Misiones', 'nea', 'completado', 'efectivo', 'manual', '2026-09-14');

insert into order_items (order_id, product_id, qty) values
  ('P-1001', 'panel-550w', 6),
  ('P-1001', 'inversor-hibrido-5kw', 1),
  ('P-1002', 'bateria-litio-5kwh', 1),
  ('P-1003', 'conectores-mc4', 4),
  ('P-1003', 'cable-solar-6mm', 1),
  ('P-1004', 'panel-450w', 4);

insert into projects (id, customer_name, customer_phone, city, zone, type, system_kwp, panels_count, status, salesperson_id, technician_id, scheduled_date, created_at) values
  ('p1', 'Cliente de ejemplo 1', '+54 9 3754 000001', 'Posadas, Misiones', 'NEA / Litoral', 'residencial', 3.2, 6, 'mantenimiento', 'team-3', 'team-4', '2026-08-20', '2026-07-30'),
  ('p2', 'Cliente de ejemplo 4', '+54 9 3754 000004', 'Puerto Iguazú, Misiones', 'NEA / Litoral', 'residencial', 4.8, 9, 'instalacion', 'team-3', 'team-4', '2026-09-22', '2026-09-10'),
  ('p3', 'Cliente de ejemplo 2', '+54 9 3754 000002', 'Eldorado, Misiones', 'NEA / Litoral', 'residencial', 2.4, 4, 'contrato', 'team-3', null, null, '2026-09-05'),
  ('p4', 'Cliente de ejemplo 3', '+54 9 3755 000003', 'Oberá, Misiones', 'NEA / Litoral', 'comercial', 12.5, 23, 'visita_tecnica', 'team-2', null, '2026-09-25', '2026-09-14'),
  ('p5', 'Panadería La Espiga (ejemplo)', '+54 9 11 5555 0005', 'CABA', 'AMBA', 'comercial', 8.1, 15, 'cotizacion', 'team-2', null, null, '2026-09-15');

update store_settings set
  store_name = 'BH Electric Solar',
  whatsapp = '+54 9 3754 419198',
  email = 'info@bhelectricsolar.com',
  instagram = 'https://www.instagram.com/bheletricsolutions/',
  currency = 'USD',
  exchange_rate = 1450,
  exchange_rate_mode = 'auto',
  low_stock_threshold = 8
where id = 1;
