-- Photos: path must start with the uploader's store id
create policy "store uploads proofs" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = public.current_store_id()::text);
create policy "store reads proofs" on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = public.current_store_id()::text);

-- Distance in meters between two coordinates
create or replace function public.dist_m(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision language sql immutable set search_path = public as $$
  select 6371000 * 2 * asin(sqrt(power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)))
$$;

-- After 3 reports within 30 m from different users in the last 6 hours, move the official spot
create or replace function public.apply_location_consensus() returns trigger
language plpgsql security definer set search_path = public as $$
declare _n integer; _lat double precision; _lng double precision;
begin
  if new.nova_latitude is null or new.nova_longitude is null then return new; end if;
  select count(distinct r.user_id), avg(r.nova_latitude), avg(r.nova_longitude) into _n, _lat, _lng
  from public.carrier_location_reports r
  where r.carrier_id = new.carrier_id and r.created_at > now() - interval '6 hours'
    and r.nova_latitude is not null
    and public.dist_m(r.nova_latitude, r.nova_longitude, new.nova_latitude, new.nova_longitude) <= 30;
  if _n >= 3 then
    update public.carriers set latitude = _lat, longitude = _lng,
      setor_vaga_texto = coalesce(nullif(trim(new.nova_vaga_texto), ''), setor_vaga_texto)
    where id = new.carrier_id;
  end if;
  return new;
end $$;
create trigger trg_location_consensus after insert on public.carrier_location_reports
  for each row execute function public.apply_location_consensus();

-- Confirm delivery of one stop: marks courier's packages delivered and records queue time
create or replace function public.confirmar_entrega(_ids uuid[], _foto_url text, _carrier_id uuid, _chegada_em timestamptz)
returns integer language plpgsql security definer set search_path = public as $$
declare _n integer; _now timestamptz := now(); _chegada timestamptz := least(coalesce(_chegada_em, now()), now());
begin
  if public.current_store_id() is null then raise exception 'Sem loja'; end if;
  if _foto_url is null or split_part(_foto_url, '/', 1) <> public.current_store_id()::text then raise exception 'Foto inválida'; end if;
  with upd as (
    update public.deliveries set status = 'entregue', foto_comprovante_url = _foto_url, entregue_em = _now
    where id = any(_ids) and courier_id = auth.uid() and status in ('em_rota','atrasado')
    returning 1)
  select count(*) into _n from upd;
  if _n > 0 and _carrier_id is not null then
    insert into public.queue_telemetry(carrier_id, courier_id, chegada_em, entrega_confirmada_em, duracao_segundos, dia_semana)
    values (_carrier_id, auth.uid(), _chegada, _now, extract(epoch from (_now - _chegada))::int, extract(dow from _now)::smallint);
  end if;
  return _n;
end $$;
revoke execute on function public.confirmar_entrega(uuid[], text, uuid, timestamptz) from anon, public;
grant execute on function public.confirmar_entrega(uuid[], text, uuid, timestamptz) to authenticated;
revoke execute on function public.apply_location_consensus() from anon, public, authenticated;
