export function validateProfileInput(input: { nome: string; cnpj: string }) {
  if (!input.nome.trim()) throw new Error("Informe seu nome.");
  if (input.cnpj.replace(/\D/g, "").length !== 14) {
    throw new Error("CNPJ inválido: informe os 14 dígitos do CNPJ da loja.");
  }
}

export function profileErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Não foi possível concluir o cadastro. Tente novamente.";
}