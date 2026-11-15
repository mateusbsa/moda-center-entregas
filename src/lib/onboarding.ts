export function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const digit = (sum * 10) % 11;
    if ((digit === 10 ? 0 : digit) !== Number(digits[length])) return false;
  }
  return true;
}

export function validateProfileInput(input: { nome: string; cpf: string }) {
  if (!input.nome.trim()) throw new Error("Informe seu nome.");
  if (!isValidCpf(input.cpf)) {
    throw new Error("CPF inválido: informe um CPF válido com 11 dígitos.");
  }
}

export function profileErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Não foi possível concluir o cadastro. Tente novamente.";
}