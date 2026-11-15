import { describe, expect, it } from "vitest";
import { profileErrorMessage, validateProfileInput } from "./onboarding";

describe("Profile input", () => {
  it("rejects an invalid 11-digit CPF", () => {
    expect(() => validateProfileInput({ nome: "Lojista", cpf: "12345678901" })).toThrow();
  });
  it("rejects the 15-digit CPF that failed registration", () => {
    expect(() => validateProfileInput({ nome: "Entregador", cpf: "000000000000000" })).toThrow();
  });
  it("accepts a formatted 11-digit CPF", () => {
    expect(() => validateProfileInput({ nome: "Lojista", cpf: "529.982.247-25" })).not.toThrow();
  });
  it("preserves the database error instead of replacing it with a generic error", () => {
    expect(profileErrorMessage({ message: "Nenhuma loja encontrada com este CPF", code: "P0001" })).toBe("Nenhuma loja encontrada com este CPF");
  });
});