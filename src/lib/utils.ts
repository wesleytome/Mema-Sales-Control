import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um número para o formato monetário brasileiro (R$ 1.000.000,00)
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

/**
 * Remove a formatação monetária e retorna apenas o número
 * Ex: "R$ 1.000.000,00" -> 1000000.00
 */
export function unformatCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove tudo exceto números, vírgula e ponto
  const cleaned = value
    .replace(/[^\d,.-]/g, '') // Remove R$, espaços, etc
    .replace(/\./g, '') // Remove pontos (separadores de milhar)
    .replace(',', '.'); // Substitui vírgula por ponto para decimal
  
  const numValue = parseFloat(cleaned);
  return isNaN(numValue) ? 0 : numValue;
}

