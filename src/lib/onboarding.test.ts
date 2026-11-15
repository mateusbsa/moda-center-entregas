import { describe, expect, it } from "vitest";
import { profileErrorMessage, validateProfileInput } from "./onboarding";

describe("Profile input", () => {
  it("rejects the 11-digit CNPJ that failed registration", () => {
    expect(() => validateProfileInput({ nome: "Lojista", cnpj: "12345678901" })).toThrow();
  });
  it("rejects the 15-digit CNPJ that failed registration", () => {
    expect(() => validateProfileInput({ nome: "Entregador", cnpj: "000000000000000" })).toThrow();
  });
  it("accepts a formatted 14-digit CNPJ", () => {
    expect(() => validateProfileInput({ nome: "Lojista", cnpj: "12.345.678/0001-90" })).not.toThrow();
  });
  it("preserves the database error instead of replacing it with a generic error", () => {
    expect(profileErrorMessage({ message: "Nenhuma loja encontrada com este CNPJ", code: "P0001" })).toBe("Nenhuma loja encontrada com este CNPJ");
  });
});