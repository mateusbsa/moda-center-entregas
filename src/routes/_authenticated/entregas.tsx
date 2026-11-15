import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { profileQuery } from "@/lib/profile";
import { TIPO_LABEL, fmtHora, hojeAs } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/entregas")({
  head: () => ({ meta: [{ title: "Entregas da semana — Carga MC" }, { name: "description", content: "Cadastro rápido de entregas da loja." }, { property: "og:title", content: "Entregas da semana — Carga MC" }, { property: "og:description", content: "Organize os pacotes e entregas atacadistas da sua loja no Moda Center." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Entregas,
});

const selectCls = "h-12 w-full rounded-lg border-2 border-input bg-card px-3 text-base font-medium";

function Entregas() {
  const qc = useQueryClient();
  const { data: perfil } = useQuery(profileQuery);
  const carriers = useQuery({ queryKey: ["carriers"], queryFn: async () => (await supabase.from("carriers").select("*").order("nome")).data ?? [] });
  const entregas = useQuery({
    queryKey: ["deliveries"],
    enabled: !!perfil,
    queryFn: async () => {
      const { data, error } = await supabase.from("deliveries").select("*, carriers(nome, setor_vaga_texto), users(nome)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const vazio = { nome_cliente: "", cidade_destino: "", carrier_id: "", qtd_volumes: "1", tamanho_volume: "M" as "P" | "M" | "G", horario_limite: "", observacao: "" };
  const [f, setF] = useState(vazio);
  const [novaAberta, setNovaAberta] = useState(false);
  const carrier = carriers.data?.find((c) => c.id === f.carrier_id);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Sem perfil");
      const { error } = await supabase.from("deliveries").insert({
        store_id: perfil.store_id,
        nome_cliente: f.nome_cliente.trim(),
        cidade_destino: f.cidade_destino.trim(),
        carrier_id: f.carrier_id || null,
        qtd_volumes: Math.max(1, Number(f.qtd_volumes) || 1),
        tamanho_volume: f.tamanho_volume,
        horario_limite: f.horario_limite ? new Date(f.horario_limite).toISOString() : null,
        observacao: f.observacao.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entrega cadastrada");
      setF(vazio);
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (perfil && perfil.role !== "admin") return <><AppHeader title="Acesso restrito" /><p className="p-6 text-lg">Esta tela é para lojistas.</p></>;

  return (
    <div className="mx-auto min-h-screen max-w-md pb-12">
      <AppHeader title="Entregas da semana" subtitle={perfil?.stores?.nome} />
      <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); salvar.mutate(); }}>
        <h2 className="text-xl">Nova entrega</h2>
        <Campo label="Cliente"><Input required value={f.nome_cliente} onChange={(e) => setF({ ...f, nome_cliente: e.target.value })} /></Campo>
        <Campo label="Cidade de destino"><Input required value={f.cidade_destino} onChange={(e) => setF({ ...f, cidade_destino: e.target.value })} /></Campo>
        <Campo label="Excursão / Transportadora">
          <div className="flex gap-2">
            <select className={selectCls} value={f.carrier_id} onChange={(e) => {
              const c = carriers.data?.find((x) => x.id === e.target.value);
              setF({ ...f, carrier_id: e.target.value, horario_limite: c?.horario_saida_padrao ? hojeAs(c.horario_saida_padrao) : f.horario_limite });
            }}>
              <option value="">Selecione…</option>
              {carriers.data?.map((c) => <option key={c.id} value={c.id}>{c.nome} · {TIPO_LABEL[c.tipo]}</option>)}
            </select>
            <Button type="button" variant="dark" size="icon" className="size-12 shrink-0" aria-label="Nova transportadora" onClick={() => setNovaAberta(true)}><Plus className="size-6" /></Button>
          </div>
          {carrier && (
            <div className="mt-2 flex flex-wrap gap-2 rounded-lg bg-secondary p-3 text-base font-bold text-secondary-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-5" />{carrier.setor_vaga_texto || "Vaga não informada"}</span>
              <span className="flex items-center gap-1"><Clock className="size-5" />Sai {carrier.horario_saida_padrao?.slice(0, 5) ?? "—"}</span>
            </div>
          )}
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Volumes"><Input required type="number" inputMode="numeric" min={1} value={f.qtd_volumes} onChange={(e) => setF({ ...f, qtd_volumes: e.target.value })} /></Campo>
          <Campo label="Tamanho">
            <div className="grid h-12 grid-cols-3 gap-1">
              {(["P", "M", "G"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setF({ ...f, tamanho_volume: t })} className={`rounded-lg border-2 border-foreground text-lg font-black ${f.tamanho_volume === t ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t}</button>
              ))}
            </div>
          </Campo>
        </div>
        <Campo label="Horário limite"><Input type="datetime-local" value={f.horario_limite} onChange={(e) => setF({ ...f, horario_limite: e.target.value })} /></Campo>
        <Campo label="Observação"><Textarea className="border-2 border-input bg-card text-base" value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} /></Campo>
        <Button type="submit" variant="action" size="xl" disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : "Cadastrar entrega"}</Button>
      </form>

      <section className="space-y-3 p-4">
        <h2 className="text-xl">Pacotes cadastrados ({entregas.data?.length ?? 0})</h2>
        {entregas.data?.length === 0 && <p className="font-medium text-muted-foreground">Nenhuma entrega ainda.</p>}
        {entregas.data?.map((d) => (
          <article key={d.id} className="card-hard p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-lg font-black">{d.nome_cliente}</p>
                <p className="font-semibold">{d.cidade_destino} · {d.carriers?.nome ?? "Sem transportadora"}</p>
              </div>
              <StatusBadge status={d.status} />
            </div>
            <p className="mt-2 font-bold">{d.qtd_volumes} vol. · {d.tamanho_volume} · até {fmtHora(d.horario_limite)}</p>
            {d.users?.nome && <p className="text-sm font-medium text-muted-foreground">Entregador: {d.users.nome}</p>}
            {d.observacao && <p className="mt-1 text-sm font-medium text-muted-foreground">{d.observacao}</p>}
          </article>
        ))}
      </section>

      <NovaTransportadora open={novaAberta} onOpenChange={setNovaAberta} onCreated={(id, hora) => {
        qc.invalidateQueries({ queryKey: ["carriers"] });
        setF((s) => ({ ...s, carrier_id: id, horario_limite: hora ? hojeAs(hora) : s.horario_limite }));
      }} />
    </div>
  );
}

function NovaTransportadora({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string, hora: string | null) => void }) {
  const [f, setF] = useState({ nome: "", tipo: "excursao_interna" as keyof typeof TIPO_LABEL, vaga: "", hora: "" });
  const criar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("carriers").insert({ nome: f.nome.trim(), tipo: f.tipo, setor_vaga_texto: f.vaga.trim() || null, horario_saida_padrao: f.hora || null }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => { toast.success("Transportadora cadastrada"); onCreated(id, f.hora || null); onOpenChange(false); setF({ nome: "", tipo: "excursao_interna", vaga: "", hora: "" }); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-foreground">
        <DialogHeader><DialogTitle className="font-display text-xl">Nova excursão / transportadora</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); criar.mutate(); }}>
          <Campo label="Nome"><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Campo>
          <Campo label="Tipo">
            <select className={selectCls} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as keyof typeof TIPO_LABEL })}>
              {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo label="Setor / Vaga"><Input placeholder="Ex.: Estacionamento A - Vaga 12" value={f.vaga} onChange={(e) => setF({ ...f, vaga: e.target.value })} /></Campo>
          <Campo label="Horário de saída"><Input type="time" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} /></Campo>
          <Button type="submit" variant="action" size="xl" disabled={criar.isPending}>Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-base font-bold">{label}</Label>{children}</div>;
}
