alter table public.stores add column cpf text unique;
comment on column public.stores.cnpj is 'DEPRECATED: replaced by cpf; preserved for historical records and compatibility';
create or replace function public.register_profile(_perfil public.user_role, _nome text, _telefone text, _cnpj text, _store_nome text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _store uuid; _clean text := regexp_replace(coalesce(_cnpj,''), '\D', '', 'g'); _sum integer; _digit integer; _i integer; _stage integer;
begin
 if auth.uid() is null then raise exception 'Não autenticado'; end if;
 if exists(select 1 from public.users where id = auth.uid()) then raise exception 'Perfil já cadastrado'; end if;
 if length(_clean) <> 11 or _clean = repeat(left(_clean,1),11) then raise exception 'CPF inválido'; end if;
 for _stage in 9..10 loop
   _sum := 0;
   for _i in 1.._stage loop _sum := _sum + substring(_clean,_i,1)::integer * (_stage+2-_i); end loop;
   _digit := (_sum * 10) % 11;
   if _digit = 10 then _digit := 0; end if;
   if _digit <> substring(_clean,_stage+1,1)::integer then raise exception 'CPF inválido'; end if;
 end loop;
 if nullif(trim(_nome),'') is null then raise exception 'Informe seu nome'; end if;
 if _perfil = 'admin' then
   if exists(select 1 from public.stores where cpf = _clean) then raise exception 'Loja já cadastrada com este CPF'; end if;
   insert into public.stores(nome, cnpj, cpf) values(coalesce(nullif(trim(_store_nome),''),'Minha loja'), 'cpf:' || _clean, _clean) returning id into _store;
 else
   select id into _store from public.stores where cpf = _clean;
   if _store is null then raise exception 'Nenhuma loja encontrada com este CPF do lojista'; end if;
 end if;
 insert into public.users(id,store_id,nome,telefone,role) values(auth.uid(),_store,trim(_nome),_telefone,_perfil);
 return _store;
end $$;