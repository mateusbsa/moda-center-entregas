import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = "admin" | "entregador";

/** Loads the signed-in user's profile; finishes pending onboarding saved at signup. */
export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return null;
    let { data } = await supabase.from("users").select("*, stores(nome, cnpj)").eq("id", user.id).maybeSingle();
    if (!data) {
      const m = user.user_metadata as { perfil?: Perfil; nome?: string; telefone?: string; cnpj?: string; store_nome?: string };
      if (m.perfil && m.cnpj && m.nome) {
        const { error } = await supabase.rpc("register_profile", {
          _perfil: m.perfil,
          _nome: m.nome,
          _telefone: m.telefone ?? "",
          _cnpj: m.cnpj,
          ...(m.store_nome ? { _store_nome: m.store_nome } : {}),
        });
        if (error) throw error;
        ({ data } = await supabase.from("users").select("*, stores(nome, cnpj)").eq("id", user.id).maybeSingle());
      }
    }
    return data;
  },
});
