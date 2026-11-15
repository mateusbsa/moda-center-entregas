import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { validateProfileInput } from "./onboarding";

export type Perfil = "admin" | "entregador";

/** Loads the signed-in user's profile; finishes pending onboarding saved at signup. */
export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = auth.user;
    if (!user) return null;
    let { data, error: readError } = await supabase.from("users").select("*, stores(nome, cnpj)").eq("id", user.id).maybeSingle();
    if (readError) throw readError;
    if (!data) {
      const m = user.user_metadata as { perfil?: Perfil; nome?: string; telefone?: string; cnpj?: string; store_nome?: string };
      if (m.perfil && m.cnpj && m.nome) {
        validateProfileInput({ nome: m.nome, cnpj: m.cnpj });
        const { error } = await supabase.rpc("register_profile", {
          _perfil: m.perfil,
          _nome: m.nome,
          _telefone: m.telefone ?? "",
          _cnpj: m.cnpj,
          ...(m.store_nome ? { _store_nome: m.store_nome } : {}),
        });
        if (error) throw error;
        ({ data, error: readError } = await supabase.from("users").select("*, stores(nome, cnpj)").eq("id", user.id).maybeSingle());
        if (readError) throw readError;
      }
    }
    return data;
  },
  retry: false,
});
