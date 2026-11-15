import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { profileQuery } from "@/lib/profile";
import { fmtHora } from "@/lib/format";
import { ProfileRequired } from "@/components/ProfileRequired";

export const Route = createFileRoute("/_authenticated/carga")({
  head: () => ({ meta: [{ title: "Montar carga — Carga MC" }, { name: "description", content: "Marque os volumes colocados no veículo e inicie a rota." }, { property: "og:title", content: "Montar carga — Carga MC" }, { property: "og:description", content: "Selecione os pacotes da loja e inicie sua rota no Moda Center." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ProfileRequired><Carga /></ProfileRequired>,
});

function Carga() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: perfil } = useQuery(profileQuery);
  const [sel, setSel] = useState<string[]>([]);
  const pendentes = useQuery({
    queryKey: ["pendentes"],
    enabled: !!perfil,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("deliveries").select("*, carriers(nome, setor_vaga_texto)")
        .eq("status", "pendente_carga").is("courier_id", null).order("horario_limite", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const volumes = pendentes.data?.filter((d) => sel.includes(d.id)).reduce((a, d) => a + d.qtd_volumes, 0) ?? 0;

  const iniciar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("iniciar_rota", { _ids: sel });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      if (n < sel.length) toast.warning(`${sel.length - n} pacote(s) já foram pegos por outro entregador.`);
      setSel([]);
      qc.invalidateQueries({ queryKey: ["pendentes"] });
      if (n > 0) navigate({ to: "/rota" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto min-h-screen max-w-md pb-36">
      <AppHeader title="Montar carga" subtitle={perfil ? `${perfil.nome} · ${perfil.stores?.nome ?? ""}` : undefined} />
      <div className="flex items-center justify-between p-4">
        <h2 className="text-xl">Aguardando carga ({pendentes.data?.length ?? 0})</h2>
        <Button variant="link" onClick={() => navigate({ to: "/rota" })}>Minha rota</Button>
      </div>
      <ul className="space-y-3 px-4">
        {pendentes.isLoading && <p className="font-medium">Carregando…</p>}
        {pendentes.data?.length === 0 && <p className="text-lg font-medium text-muted-foreground">Nenhum pacote aguardando carga.</p>}
        {pendentes.data?.map((d) => {
          const on = sel.includes(d.id);
          return (
            <li key={d.id}>
              <button onClick={() => toggle(d.id)} aria-pressed={on} className={`card-hard flex w-full items-center gap-4 p-4 text-left transition ${on ? "bg-secondary" : ""}`}>
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-foreground ${on ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  {on && <Check className="size-8" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-black">{d.qtd_volumes}× {d.tamanho_volume} — {d.nome_cliente}</span>
                  <span className="block truncate font-semibold">{d.carriers?.nome ?? "Sem transportadora"} · {d.cidade_destino}</span>
                  <span className="flex items-center gap-1 text-sm font-bold"><MapPin className="size-4" />{d.carriers?.setor_vaga_texto ?? "—"} · até {fmtHora(d.horario_limite)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-foreground bg-background p-4">
        <div className="mx-auto max-w-md">
          <Button variant="action" size="xl" disabled={sel.length === 0 || iniciar.isPending} onClick={() => iniciar.mutate()}>
            <Truck className="size-6!" /> Iniciar Rota {sel.length > 0 && `· ${sel.length} pacote(s), ${volumes} vol.`}
          </Button>
        </div>
      </div>
    </div>
  );
}
