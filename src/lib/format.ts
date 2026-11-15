export const STATUS_LABEL = {
  pendente_carga: "Aguardando carga",
  em_rota: "Em rota",
  entregue: "Entregue",
  atrasado: "Atrasado",
} as const;

export const TIPO_LABEL = {
  excursao_interna: "Excursão",
  box_interno: "Box interno",
  transportadora_externa: "Transportadora",
} as const;

/** Builds a datetime-local value for today at the given HH:MM[:SS] time. */
export function hojeAs(hora: string | null | undefined, base = new Date()): string {
  if (!hora) return "";
  const [h = "00", m = "00"] = hora.split(":");
  const d = new Date(base);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function fmtHora(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}
