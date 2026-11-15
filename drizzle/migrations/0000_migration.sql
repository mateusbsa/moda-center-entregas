
create type public.user_role as enum ('admin','entregador');
create type public.carrier_tipo as enum ('excursao_interna','box_interno','transportadora_externa');
create type public.tamanho_volume as enum ('P','M','G');
create type public.delivery_status as enum ('pendente_carga','em_rota','entregue','atrasado');

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  nome text not null,
  telefone text,
  role public.user_role not null default 'entregador',
  ativo boolean not null default true
);

create table public.carriers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo public.carrier_tipo not null default 'excursao_interna',
  latitude double precision,
  longitude double precision,
  setor_vaga_texto text,
  horario_saida_padrao time,
  tempo_medio_fila_minutos integer not null default 0,
  alerta_fila_ativo boolean not null default false
);

create table public.carrier_location_reports (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.carriers(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  nova_latitude double precision,
  nova_longitude double precision,
  nova_vaga_texto text,
  created_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  courier_id uuid references public.users(id) on delete set null,
  carrier_id uuid references public.carriers(id) on delete set null,
  nome_cliente text not null,
  cidade_destino text not null,
  qtd_volumes integer not null default 1,
  tamanho_volume public.tamanho_volume not null default 'M',
  horario_limite timestamptz,
  observacao text,
  status public.delivery_status not null default 'pendente_carga',
  foto_comprovante_url text,
  entregue_em timestamptz,
  ordem_rota integer,
  created_at timestamptz not null default now()
);

create table public.queue_telemetry (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.carriers(id) on delete cascade,
  courier_id uuid not null references public.users(id) on delete cascade,
  chegada_em timestamptz not null default now(),
  entrega_confirmada_em timestamptz,
  duracao_segundos integer,
  dia_semana smallint
);

grant select, insert, update, delete on public.stores, public.users, public.carriers, public.carrier_location_reports, public.deliveries, public.queue_telemetry to authenticated;
grant all on public.stores, public.users, public.carriers, public.carrier_location_reports, public.deliveries, public.queue_telemetry to service_role;

alter table public.stores enable row level security;
alter table public.users enable row level security;
alter table public.carriers enable row level security;
alter table public.carrier_location_reports enable row level security;
alter table public.deliveries enable row level security;
alter table public.queue_telemetry enable row level security;

create or replace function public.current_store_id() returns uuid
language sql stable security definer set search_path = public as $$
  select store_id from public.users where id = auth.uid() and ativo
$$;

create or replace function public.is_store_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.users where id = auth.uid() and role = 'admin' and ativo)
$$;

-- stores
create policy "members read own store" on public.stores for select to authenticated using (id = public.current_store_id());
create policy "admin updates own store" on public.stores for update to authenticated using (id = public.current_store_id() and public.is_store_admin());

-- users
create policy "read users of same store" on public.users for select to authenticated using (id = auth.uid() or store_id = public.current_store_id());
create policy "admin updates store users" on public.users for update to authenticated
  using (store_id = public.current_store_id() and public.is_store_admin())
  with check (store_id = public.current_store_id());

-- carriers (shared catalog of the Moda Center)
create policy "auth read carriers" on public.carriers for select to authenticated using (true);
create policy "members add carriers" on public.carriers for insert to authenticated with check (public.current_store_id() is not null);

-- location reports
create policy "auth read reports" on public.carrier_location_reports for select to authenticated using (true);
create policy "insert own report" on public.carrier_location_reports for insert to authenticated with check (user_id = auth.uid());

-- deliveries
create policy "store members read deliveries" on public.deliveries for select to authenticated using (store_id = public.current_store_id());
create policy "admin inserts deliveries" on public.deliveries for insert to authenticated with check (store_id = public.current_store_id() and public.is_store_admin());
create policy "admin updates deliveries" on public.deliveries for update to authenticated using (store_id = public.current_store_id() and public.is_store_admin()) with check (store_id = public.current_store_id());
create policy "courier updates own deliveries" on public.deliveries for update to authenticated using (store_id = public.current_store_id() and courier_id = auth.uid()) with check (store_id = public.current_store_id() and courier_id = auth.uid());
create policy "admin deletes deliveries" on public.deliveries for delete to authenticated using (store_id = public.current_store_id() and public.is_store_admin());

-- telemetry
create policy "auth read telemetry" on public.queue_telemetry for select to authenticated using (true);
create policy "courier inserts own telemetry" on public.queue_telemetry for insert to authenticated with check (courier_id = auth.uid());
create policy "courier updates own telemetry" on public.queue_telemetry for update to authenticated using (courier_id = auth.uid());

-- Onboarding: lojista creates store (admin); entregador joins store by CNPJ
create or replace function public.register_profile(_perfil public.user_role, _nome text, _telefone text, _cnpj text, _store_nome text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _store uuid; _clean text := regexp_replace(coalesce(_cnpj,''), '\D', '', 'g');
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if exists(select 1 from public.users where id = auth.uid()) then raise exception 'Perfil já cadastrado'; end if;
  if length(_clean) <> 14 then raise exception 'CNPJ inválido'; end if;
  if _perfil = 'admin' then
    if exists(select 1 from public.stores where cnpj = _clean) then raise exception 'Loja já cadastrada com este CNPJ'; end if;
    insert into public.stores(nome, cnpj) values (coalesce(nullif(trim(_store_nome),''),'Minha loja'), _clean) returning id into _store;
  else
    select id into _store from public.stores where cnpj = _clean;
    if _store is null then raise exception 'Nenhuma loja encontrada com este CNPJ'; end if;
  end if;
  insert into public.users(id, store_id, nome, telefone, role) values (auth.uid(), _store, trim(_nome), _telefone, _perfil);
  return _store;
end $$;

-- Start route: atomically claim pending deliveries for the calling courier
create or replace function public.iniciar_rota(_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare _store uuid := public.current_store_id(); _n integer;
begin
  if _store is null then raise exception 'Sem loja'; end if;
  with upd as (
    update public.deliveries d set status = 'em_rota', courier_id = auth.uid(),
      ordem_rota = array_position(_ids, d.id)
    where d.id = any(_ids) and d.store_id = _store and d.status = 'pendente_carga' and d.courier_id is null
    returning 1)
  select count(*) into _n from upd;
  return _n;
end $$;

revoke execute on function public.register_profile(public.user_role, text, text, text, text) from anon, public;
revoke execute on function public.iniciar_rota(uuid[]) from anon, public;
grant execute on function public.register_profile(public.user_role, text, text, text, text) to authenticated;
grant execute on function public.iniciar_rota(uuid[]) to authenticated;
grant execute on function public.current_store_id() to authenticated;
grant execute on function public.is_store_admin() to authenticated;

insert into public.carriers(nome, tipo, setor_vaga_texto, horario_saida_padrao, tempo_medio_fila_minutos) values
 ('Excursão Caruaru Express','excursao_interna','Estacionamento A - Vaga 12','17:00',15),
 ('Excursão Recife Moda','excursao_interna','Estacionamento B - Vaga 3','16:30',25),
 ('Box Transportes Sertão','box_interno','Box 214 - Setor Azul','18:00',10),
 ('Rápido Nordeste Cargas','transportadora_externa','Portão 4 - Doca Externa','15:00',30);
