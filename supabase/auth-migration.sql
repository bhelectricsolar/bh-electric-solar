-- BH Electric Solar — sistema de login (idempotente: se puede correr más de una vez sin romper nada)

alter table team_members add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table team_members add column if not exists username text unique;

drop policy if exists "public read/write categories" on categories;
drop policy if exists "public read/write products" on products;
drop policy if exists "public read/write shipping_zones" on shipping_zones;
drop policy if exists "public read/write customers" on customers;
drop policy if exists "public read/write team_members" on team_members;
drop policy if exists "public read/write orders" on orders;
drop policy if exists "public read/write order_items" on order_items;
drop policy if exists "public read/write projects" on projects;
drop policy if exists "public read/write store_settings" on store_settings;
drop policy if exists "public read/write cash_sessions" on cash_sessions;
drop policy if exists "public read/write cash_movements" on cash_movements;

drop policy if exists "public read categories" on categories;
drop policy if exists "authenticated write categories" on categories;
drop policy if exists "authenticated update categories" on categories;
drop policy if exists "authenticated delete categories" on categories;
create policy "public read categories" on categories for select using (true);
create policy "authenticated write categories" on categories for insert with check (auth.uid() is not null);
create policy "authenticated update categories" on categories for update using (auth.uid() is not null);
create policy "authenticated delete categories" on categories for delete using (auth.uid() is not null);

drop policy if exists "public read published products" on products;
drop policy if exists "authenticated write products" on products;
drop policy if exists "authenticated update products" on products;
drop policy if exists "authenticated delete products" on products;
create policy "public read published products" on products for select using (published_online = true or auth.uid() is not null);
create policy "authenticated write products" on products for insert with check (auth.uid() is not null);
create policy "authenticated update products" on products for update using (auth.uid() is not null);
create policy "authenticated delete products" on products for delete using (auth.uid() is not null);

drop policy if exists "authenticated read/write shipping_zones" on shipping_zones;
drop policy if exists "authenticated read/write customers" on customers;
drop policy if exists "authenticated read/write team_members" on team_members;
drop policy if exists "authenticated read/write orders" on orders;
drop policy if exists "authenticated read/write order_items" on order_items;
drop policy if exists "authenticated read/write projects" on projects;
drop policy if exists "authenticated read/write store_settings" on store_settings;
drop policy if exists "authenticated read/write cash_sessions" on cash_sessions;
drop policy if exists "authenticated read/write cash_movements" on cash_movements;
create policy "authenticated read/write shipping_zones" on shipping_zones for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write customers" on customers for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write team_members" on team_members for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write orders" on orders for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write order_items" on order_items for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write projects" on projects for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write store_settings" on store_settings for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write cash_sessions" on cash_sessions for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated read/write cash_movements" on cash_movements for all using (auth.uid() is not null) with check (auth.uid() is not null);
