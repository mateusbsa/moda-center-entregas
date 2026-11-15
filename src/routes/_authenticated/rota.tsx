import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, Crosshair, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { RouteMap, type PontoMapa } from "@/components/RouteMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { profileQuery } from "@/lib/profile";
import { fmtHora } from "@/lib/format";
import { RAIO_CHEGADA_M, agruparParadas, distanciaM, resumoPorCliente, trazerParaFrente } from "@/lib/route";
import { ProfileRequired } from "@/components/ProfileRequired";

export const Route = createFileRoute("/_authenticated/rota")({
  head: () => ({ meta: [{ title: "Rota em andamento — Carga MC" }, { name: "description", content: "Mapa e paradas da rota com comprovante por foto." }, { property: "og:title", content: "Rota em andamento — Carga MC" }, { property: "og:description", content: "Acompanhe as paradas no Moda Center e confirme entregas com foto." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ProfileRequired><Rota /></ProfileRequired>,
});

function Rota() {
  const qc = useQueryClient();
  const { data: perfil } = useQuery(profileQuery);
  const rota = useQuery({
    queryKey: ["rota", perfil?.id],
    enabled: !!perfil,
    queryFn: async () => {
      if (!perfil) return [];
      const { data, error } = await supabase.from("deliveries")
        .select("*, carriers(id, nome, setor_vaga_texto, latitude, longitude, alerta_fila_ativo)")
        .in("status", ["em_rota", "atrasado"]).eq("courier_id", perfil.id).order("ordem_rota");
      if (error) throw error;
      return data;
    },
  });
  const paradas = useMemo(() => agruparParadas(rota.data ?? []), [rota.data]);
  const alvo = paradas[0];
  const carrierAlvo = alvo?.pacotes[0]?.carriers ?? null;

  // GPS em tempo real
  const [me, setMe] = useState<[number, number] | null>(null);
  const [gpsErro, setGpsErro] = useState<string | null>(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) { setGpsErro("GPS indisponível"); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setMe([p.coords.latitude, p.coords.longitude]); setGpsErro(null); },
      (e) => setGpsErro(e.message || "Sem permissão de localização"),
      { enableHighAccuracy: true, maximumAge: 2000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const distancia = me && carrierAlvo?.latitude != null && carrierAlvo.longitude != null
    ? distanciaM(me, [carrierAlvo.latitude, carrierAlvo.longitude]) : null;

  // Chegada: abre o modal automaticamente dentro do raio, uma vez por parada
  const [modalAberto, setModalAberto] = useState(false);
  const chegadas = useRef<Record<string, string>>({});
  const autoAberto = useRef<string | null>(null);
  function chegar() {
    if (!alvo) return;
    chegadas.current[alvo.key] ??= new Date().toISOString();
    setModalAberto(true);
  }
  useEffect(() => {
    if (alvo && distancia != null && distancia <= RAIO_CHEGADA_M && autoAberto.current !== alvo.key) {
      autoAberto.current = alvo.key;
      chegar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distancia, alvo?.key]);

  // Tocar num card torna a parada #1
  const reordenar = useMutation({
    mutationFn: async (idx: number) => {
      const nova = trazerParaFrente(paradas, idx);
      let ordem = 1;
      const updates = nova.flatMap((s) => s.pacotes.map((p) => ({ id: p.id, ordem: ordem++ })));
      qc.setQueryData(["rota", perfil?.id], (old: typeof rota.data) =>
        old?.map((d) => ({ ...d, ordem_rota: updates.find((u) => u.id === d.id)?.ordem ?? d.ordem_rota })));
      const res = await Promise.all(updates.map((u) => supabase.from("deliveries").update({ ordem_rota: u.ordem }).eq("id", u.id)));
      const err = res.find((r) => r.error)?.error;
      if (err) throw err;
    },
    onError: (e) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["rota"] }); },
  });

  const pontos: PontoMapa[] = paradas.flatMap((s, i) => {
    const c = s.pacotes[0]?.carriers;
    return c?.latitude != null && c.longitude != null
      ? [{ key: s.key, n: i + 1, lat: c.latitude, lng: c.longitude, alvo: i === 0, alerta: c.alerta_fila_ativo, label: c.nome }] : [];
  });

  const [reportAberto, setReportAberto] = useState(false);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <AppHeader title="Rota em andamento" subtitle={`${paradas.length} parada(s) · ${rota.data?.length ?? 0} pacote(s)`} />
      <section className="relative h-1/2 shrink-0 border-b-2 border-foreground">
        <RouteMap me={me} pontos={pontos} />
        <div className="pointer-events-none absolute inset-x-2 top-2 z-[500] flex justify-between gap-2">
          <span className="pointer-events-auto rounded-lg border-2 border-foreground bg-card px-2 py-1 text-sm font-black">
            {gpsErro ? `⚠ ${gpsErro}` : distancia != null ? `${Math.round(distancia)} m da vaga` : me ? "Vaga sem coordenada" : "Buscando GPS…"}
          </span>
          {alvo?.carrier_id && (
            <button onClick={() => setReportAberto(true)} className="pointer-events-auto rounded-lg border-2 border-foreground bg-card px-2 py-1 text-xs font-bold">
              <Crosshair className="mr-1 inline size-3.5" />Atualizar Local da Vaga
            </button>
          )}
        </div>
        {alvo && (
          <div className="absolute inset-x-2 bottom-2 z-[500]">
            <Button variant="action" size="xl" onClick={chegar}><MapPin className="size-6!" />Cheguei na Vaga</Button>
          </div>
        )}
      </section>

      <section className="min-h-0 flex-1 overflow-y-auto p-3">
        {rota.isLoading && <p className="font-medium">Carregando…</p>}
        {rota.data?.length === 0 && (
          <div className="card-hard p-5 text-center">
            <p className="text-xl font-black">Rota concluída!</p>
            <Link to="/carga" className="mt-2 inline-block font-bold underline">Montar nova carga</Link>
          </div>
        )}
        <ol className="space-y-3">
          {paradas.map((s, i) => {
            const c = s.pacotes[0]?.carriers;
            const limite = s.pacotes.map((p) => p.horario_limite).filter(Boolean).sort()[0] ?? null;
            const vol = s.pacotes.reduce((a, p) => a + p.qtd_volumes, 0);
            const tams = resumoPorCliente(s.pacotes.map((p) => ({ ...p, nome_cliente: "_" })))[0]?.texto;
            return (
              <li key={s.key}>
                <button onClick={() => i > 0 && reordenar.mutate(i)} className={`card-hard flex w-full gap-3 p-3 text-left ${i === 0 ? "bg-secondary" : ""}`}>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-xl text-primary-foreground">#{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-lg font-black">{[...new Set(s.pacotes.map((p) => p.nome_cliente))].join(", ")}</span>
                      {c?.alerta_fila_ativo && <span className="shrink-0 rounded-md bg-destructive px-1.5 py-0.5 text-xs font-black text-destructive-foreground"><AlertTriangle className="mr-0.5 inline size-3" />FILA</span>}
                    </span>
                    <span className="block truncate font-semibold">{c?.nome ?? "Sem transportadora"} · {c?.setor_vaga_texto ?? "—"}</span>
                    <span className="block text-sm font-bold">Até {fmtHora(limite)} · {vol} vol. ({tams})</span>
                  </span>
                  {i === 0 && <Navigation className="size-6 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {alvo && (
        <EntregaSheet
          key={alvo.key}
          open={modalAberto}
          onOpenChange={setModalAberto}
          storeId={perfil?.store_id ?? ""}
          carrierId={alvo.carrier_id}
          titulo={`${carrierAlvo?.nome ?? "Parada"} · ${carrierAlvo?.setor_vaga_texto ?? ""}`}
          pacotes={alvo.pacotes}
          chegadaEm={chegadas.current[alvo.key] ?? null}
          onDone={() => { setModalAberto(false); qc.invalidateQueries({ queryKey: ["rota"] }); }}
        />
      )}
      {alvo?.carrier_id && perfil && (
        <ReportDialog open={reportAberto} onOpenChange={setReportAberto} carrierId={alvo.carrier_id} userId={perfil.id} me={me} vagaAtual={carrierAlvo?.setor_vaga_texto ?? ""} />
      )}
    </div>
  );
}

type PacoteRota = { id: string; carrier_id: string | null; nome_cliente: string; qtd_volumes: number; tamanho_volume: "P" | "M" | "G"; ordem_rota: number | null };

function EntregaSheet(props: {
  open: boolean; onOpenChange: (o: boolean) => void; storeId: string; carrierId: string | null; titulo: string;
  pacotes: PacoteRota[]; chegadaEm: string | null; onDone: () => void;
}) {
  const resumo = resumoPorCliente(props.pacotes);
  const varios = resumo.length > 1;
  const [marcados, setMarcados] = useState<string[]>([]);
  const [foto, setFoto] = useState<File | null>(null);
  const preview = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const inputRef = useRef<HTMLInputElement>(null);
  const prontos = !varios || marcados.length === resumo.length;

  const confirmar = useMutation({
    mutationFn: async () => {
      if (!foto) throw new Error("Tire a foto do comprovante");
      const ext = foto.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${props.storeId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("comprovantes").upload(path, foto, { contentType: foto.type || "image/jpeg" });
      if (up.error) throw up.error;
      const { error } = await supabase.rpc("confirmar_entrega", {
        _ids: props.pacotes.map((p) => p.id), _foto_url: path, _carrier_id: props.carrierId as string,
        _chegada_em: props.chegadaEm ?? new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Entrega confirmada! Indo para a próxima parada."); setFoto(null); props.onDone(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Drawer open={props.open} onOpenChange={props.onOpenChange}>
      <DrawerContent className="border-t-2 border-foreground">
        <div className="mx-auto max-h-[80dvh] w-full max-w-md overflow-y-auto px-4 pb-6">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="font-display text-xl">{props.titulo}</DrawerTitle>
          </DrawerHeader>
          {!varios && resumo[0] && (
            <div className="card-hard bg-secondary p-4 text-center">
              <p className="font-display text-3xl">{resumo[0].cliente}</p>
              <p className="mt-1 text-xl font-black">{resumo[0].total} volume{resumo[0].total > 1 ? "s" : ""}: {resumo[0].texto}</p>
            </div>
          )}
          {varios && (
            <div className="space-y-2">
              <p className="font-bold">Separe os pacotes por cliente:</p>
              {resumo.map((r) => {
                const on = marcados.includes(r.cliente);
                return (
                  <button key={r.cliente} onClick={() => setMarcados((m) => on ? m.filter((x) => x !== r.cliente) : [...m, r.cliente])}
                    className={`card-hard flex w-full items-center gap-3 p-3 text-left ${on ? "bg-secondary" : ""}`}>
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-foreground ${on ? "bg-primary text-primary-foreground" : ""}`}>{on && <Check className="size-6" strokeWidth={3} />}</span>
                    <span><span className="block text-lg font-black">{r.cliente}</span><span className="font-bold">{r.total} vol.: {r.texto}</span></span>
                  </button>
                );
              })}
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFoto(f); e.target.value = ""; }} />

          {!preview ? (
            <Button variant="action" size="xl" className="mt-4" disabled={!prontos} onClick={() => inputRef.current?.click()}>
              <Camera className="size-6!" />{prontos ? "Entregar" : "Marque todos os clientes"}
            </Button>
          ) : (
            <div className="mt-4 space-y-3">
              <img src={preview} alt="Prévia do comprovante" className="max-h-72 w-full rounded-lg border-2 border-foreground object-cover" />
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="xl" className="col-span-1 border-2 border-foreground" onClick={() => inputRef.current?.click()}>Refazer</Button>
                <Button variant="action" size="xl" className="col-span-2" disabled={confirmar.isPending} onClick={() => confirmar.mutate()}>
                  {confirmar.isPending ? "Enviando…" : "Confirmar Entrega"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ReportDialog({ open, onOpenChange, carrierId, userId, me, vagaAtual }: {
  open: boolean; onOpenChange: (o: boolean) => void; carrierId: string; userId: string; me: [number, number] | null; vagaAtual: string;
}) {
  const [vaga, setVaga] = useState(vagaAtual);
  const enviar = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Aguarde o GPS localizar você");
      const { error } = await supabase.from("carrier_location_reports").insert({
        carrier_id: carrierId, user_id: userId, nova_latitude: me[0], nova_longitude: me[1], nova_vaga_texto: vaga.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Obrigado! Com 3 avisos de entregadores diferentes, a vaga é atualizada."); onOpenChange(false); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-foreground">
        <DialogHeader><DialogTitle className="font-display text-xl">A excursão mudou de lugar?</DialogTitle></DialogHeader>
        <p className="font-medium">Fique ao lado do veículo. Vamos usar sua posição atual como nova vaga.</p>
        <Input value={vaga} onChange={(e) => setVaga(e.target.value)} placeholder="Novo setor / vaga" />
        <Button variant="action" size="xl" disabled={enviar.isPending || !me} onClick={() => enviar.mutate()}>{me ? "Enviar nova localização" : "Buscando GPS…"}</Button>
      </DialogContent>
    </Dialog>
  );
}
