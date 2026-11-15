import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { profileQuery } from "@/lib/profile";
import { fmtHora } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/rota")({
  head: () => ({ meta: [{ title: "Minha rota — Carga MC" }, { name: "description", content: "Pacotes em rota do entregador." }] }),
  component: Rota,
});

function Rota() {
  const { data: perfil } = useQuery(profileQuery);
  const rota = useQuery({
    queryKey: ["rota", perfil?.id],
    enabled: !!perfil,
    queryFn: async () => {
      const { data, error } = await supabase.from("deliveries").select("*, carriers(nome, setor_vaga_texto)")
        .eq("status", "em_rota").eq("courier_id", perfil!.id).order("ordem_rota");
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="mx-auto min-h-screen max-w-md pb-12">
      <AppHeader title="Minha rota" subtitle={`${rota.data?.length ?? 0} parada(s)`} />
      <div className="p-4"><Link to="/carga" className="font-bold underline">← Voltar para montar carga</Link></div>
      <ol className="space-y-3 px-4">
        {rota.data?.length === 0 && <p className="text-lg font-medium text-muted-foreground">Nenhum pacote em rota.</p>}
        {rota.data?.map((d, i) => (
          <li key={d.id} className="card-hard flex gap-4 p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-xl text-primary-foreground">{i + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{d.carriers?.nome ?? "Sem transportadora"}</p>
              <p className="flex items-center gap-1 font-bold"><MapPin className="size-4" />{d.carriers?.setor_vaga_texto ?? "—"}</p>
              <p className="font-semibold">{d.qtd_volumes}× {d.tamanho_volume} · {d.nome_cliente} · {d.cidade_destino}</p>
              <p className="text-sm font-bold">Limite: {fmtHora(d.horario_limite)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
