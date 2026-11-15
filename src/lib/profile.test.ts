import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), maybeSingle: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: mocks.getUser }, rpc: mocks.rpc,
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
} }));
import { completeSignupProfile, profileQuery } from "./profile";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user", user_metadata: { perfil: "entregador", nome: "Mateus", cpf: "52998224725" } } }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
});
describe("Profile recovery", () => {
  it("never registers a profile during background reads", async () => {
    const qc = new QueryClient();
    expect(await qc.fetchQuery(profileQuery)).toBeNull();
    await qc.invalidateQueries();
    expect(await qc.fetchQuery(profileQuery)).toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("propagates read failures without trying to register again", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "Falha na leitura" } });
    await expect(new QueryClient().fetchQuery(profileQuery)).rejects.toEqual({ message: "Falha na leitura" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("preserves registration errors in the explicit entry flow", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "Nenhuma loja encontrada com este CPF" } });
    await expect(completeSignupProfile()).rejects.toEqual({ message: "Nenhuma loja encontrada com este CPF" });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("rejects invalid saved metadata before calling registration", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { user_metadata: { perfil: "admin", nome: "Mateus", cpf: "12345678901" } } }, error: null });
    await expect(completeSignupProfile()).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});