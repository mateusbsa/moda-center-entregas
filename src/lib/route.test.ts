import { describe, expect, it } from "vitest";
import { agruparParadas, distanciaM, resumoPorCliente, trazerParaFrente, type Pacote } from "./route";

const p = (id: string, carrier: string, cliente: string, qtd: number, tam: "P" | "M" | "G", ordem: number): Pacote =>
  ({ id, carrier_id: carrier, nome_cliente: cliente, qtd_volumes: qtd, tamanho_volume: tam, ordem_rota: ordem });

describe("rota", () => {
  it("same client at one spot shows grouped total like '4 volumes: 2G, 2M'", () => {
    const r = resumoPorCliente([p("1", "a", "Maria", 2, "G", 1), p("2", "a", "Maria", 2, "M", 2)]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ cliente: "Maria", total: 4, texto: "2G, 2M" });
  });
  it("different clients at one spot are listed one by one", () => {
    expect(resumoPorCliente([p("1", "a", "Maria", 1, "G", 1), p("2", "a", "João", 1, "P", 2)])).toHaveLength(2);
  });
  it("packages for the same carrier become one stop", () => {
    const s = agruparParadas([p("1", "a", "X", 1, "M", 1), p("2", "b", "Y", 1, "M", 2), p("3", "a", "Z", 1, "M", 3)]);
    expect(s.map((x) => x.key)).toEqual(["a", "b"]);
  });
  it("tapping stop #3 makes it #1 and keeps the rest in order", () => {
    expect(trazerParaFrente(["a", "b", "c", "d"], 2)).toEqual(["c", "a", "b", "d"]);
  });
  it("arrival radius: points ~3 m apart are within 5 m, ~11 m apart are not", () => {
    expect(distanciaM([-7.9408, -36.2244], [-7.94083, -36.2244])).toBeLessThan(5);
    expect(distanciaM([-7.9408, -36.2244], [-7.9409, -36.2244])).toBeGreaterThan(5);
  });
});
