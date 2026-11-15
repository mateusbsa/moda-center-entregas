drop policy "auth read carriers" on public.carriers;
create policy "members read carriers" on public.carriers for select to authenticated using (public.current_store_id() is not null);

drop policy "auth read reports" on public.carrier_location_reports;
create policy "members read reports" on public.carrier_location_reports for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.users u where u.id = carrier_location_reports.user_id and u.store_id = public.current_store_id()));

drop policy "auth read telemetry" on public.queue_telemetry;
create policy "store reads telemetry" on public.queue_telemetry for select to authenticated
  using (courier_id = auth.uid() or exists (select 1 from public.users u where u.id = queue_telemetry.courier_id and u.store_id = public.current_store_id()));
