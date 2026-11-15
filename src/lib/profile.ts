import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { validateProfileInput } from "./onboarding";

export type Perfil = "admin" | "entregador";

/** Reads only: background refreshes must never create profiles. */
export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = auth.user;
    if (!user) return null;
    const { data, error: readError } = await supabase.from("users").select("*, stores(nome)").eq("id", user.id).maybeSingle();
    if (readError) throw readError;
    return data;
  },
  retry: false,
});

/** Called only from the entry flow, never from background profile queries. */
export async function completeSignupProfile() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) return false;
  const m = data.user.user_metadata as { perfil?: Perfil; nome?: string; telefone?: string; cpf?: string; store_nome?: string };
  if (!m.perfil || !m.cpf || !m.nome) return false;
  validateProfileInput({ nome: m.nome, cpf: m.cpf });
  const result = await supabase.rpc("register_profile", {
    _perfil: m.perfil, _nome: m.nome, _telefone: m.telefone ?? "", _cnpj: m.cpf,
    ...(m.store_nome ? { _store_nome: m.store_nome } : {}),
  });
  if (result.error) throw result.error;
  return true;
}
