// Utilitários de Validação com Regex para o FateLink

// Regex de E-mail padrão (usuário@domínio.extensão)
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Regex de CPF: aceita formato 000.000.000-00 ou 11 dígitos contínuos
export const CPF_REGEX = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11})$/;

// Regex de CNPJ: aceita formato 00.000.000/0000-00 ou 14 dígitos contínuos
export const CNPJ_REGEX = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14})$/;

// Regex de Nome: no mínimo 3 caracteres
export const NOME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]{3,}$/;

// Validação de formato de e-mail por Regex
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

// Formatação / Máscara de CPF (000.000.000-00)
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2');
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
}

// Formatação / Máscara de CNPJ (00.000.000/0000-00)
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return digits.replace(/(\d{2})(\d+)/, '$1.$2');
  if (digits.length <= 8) return digits.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  if (digits.length <= 12) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
}

// Validação de CPF por Regex e contagem de 11 dígitos
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');
  return clean.length === 11 && CPF_REGEX.test(cpf.trim());
}

// Validação de CNPJ por Regex e contagem de 14 dígitos
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, '');
  return clean.length === 14 && CNPJ_REGEX.test(cnpj.trim());
}
