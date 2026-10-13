-- Supabase grants table privileges to these roles by default; RLS then restricts rows.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
