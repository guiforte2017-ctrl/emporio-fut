import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export const COPA_MODELS = [
  "Torcedor Masc Amarela",
  "Torcedor Masc Azul",
  "Torcedor Fem Amarela",
  "Torcedor Fem Azul",
  "Jogador Masc Amarela",
  "Jogador Masc Azul",
  "Personalizado",
];

// Keeps backwards compat for any legacy products
export const MODEL_LABELS: Record<string, string> = {
  "Torcedor Masc Amarela": "Torcedor Masc Amarela",
  "Torcedor Masc Azul":    "Torcedor Masc Azul",
  "Torcedor Fem Amarela":  "Torcedor Fem Amarela",
  "Torcedor Fem Azul":     "Torcedor Fem Azul",
  "Jogador Masc Amarela":  "Jogador Masc Amarela",
  "Jogador Masc Azul":     "Jogador Masc Azul",
  "Personalizado":         "Personalizado",
  home:  "Titular",
  away:  "Visitante",
  third: "Terceiro",
  retro: "Retrô",
};

export const PAYMENT_LABELS: Record<string, string> = {
  pix:  "Pix",
  card: "Cartão",
  cash: "Dinheiro",
};

export const SIZES = ["PP", "P", "M", "G", "GG", "XGG"];
export const MODELS = COPA_MODELS;
export const PAYMENT_METHODS = ["pix", "card", "cash"];
