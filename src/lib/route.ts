export const MODA_CENTER: [number, number] = [-7.9408, -36.2244];
export const RAIO_CHEGADA_M = 5;

export function distanciaM(a: [number, number], b: [number, number]): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type Pacote = {
  id: string;
  carrier_id: string | null;
  nome_cliente: string;
  qtd_volumes: number;
  tamanho_volume: "P" | "M" | "G";
  ordem_rota: number | null;
};

export type Parada<T extends Pacote> = { key: string; carrier_id: string | null; pacotes: T[] };

/** One stop per carrier (spot), ordered by the lowest route order among its packages. */
export function agruparParadas<T extends Pacote>(pacotes: T[]): Parada<T>[] {
  const map = new Map<string, Parada<T>>();
  for (const p of [...pacotes].sort((a, b) => (a.ordem_rota ?? 1e9) - (b.ordem_rota ?? 1e9))) {
    const key = p.carrier_id ?? `sem-${p.id}`;
    if (!map.has(key)) map.set(key, { key, carrier_id: p.carrier_id, pacotes: [] });
    map.get(key)!.pacotes.push(p);
  }
  return [...map.values()];
}

/** Moves the chosen stop to the front, keeping the others in their current order. */
export function trazerParaFrente<T>(lista: T[], idx: number): T[] {
  if (idx <= 0 || idx >= lista.length) return lista;
  return [lista[idx]!, ...lista.slice(0, idx), ...lista.slice(idx + 1)];
}

export type ResumoCliente = { cliente: string; total: number; texto: string; ids: string[] };

/** Groups a stop's packages per client: total volumes and "2G, 2M" breakdown. */
export function resumoPorCliente(pacotes: Pacote[]): ResumoCliente[] {
  const m = new Map<string, { total: number; tam: Record<string, number>; ids: string[] }>();
  for (const p of pacotes) {
    const k = p.nome_cliente.trim();
    const e = m.get(k) ?? { total: 0, tam: {}, ids: [] };
    e.total += p.qtd_volumes;
    e.tam[p.tamanho_volume] = (e.tam[p.tamanho_volume] ?? 0) + p.qtd_volumes;
    e.ids.push(p.id);
    m.set(k, e);
  }
  return [...m.entries()].map(([cliente, e]) => ({
    cliente,
    total: e.total,
    ids: e.ids,
    texto: (["G", "M", "P"] as const).filter((t) => e.tam[t]).map((t) => `${e.tam[t]}${t}`).join(", "),
  }));
}
