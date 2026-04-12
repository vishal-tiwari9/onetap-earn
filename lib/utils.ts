import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals = 2): string {
  if (!value || isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(decimals)}`;
}

export function formatAPY(apy: number): string {
  if (!apy || isNaN(apy)) return "0.00%";
  return `${apy.toFixed(2)}%`;
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getRiskColor(risk: string): string {
  switch ((risk || "").toLowerCase()) {
    case "low": return "text-brand-green bg-brand-green/10 border-brand-green/20";
    case "medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    default: return "text-red-400 bg-red-400/10 border-red-400/20";
  }
}

export function getRiskDot(risk: string): string {
  switch ((risk || "").toLowerCase()) {
    case "low": return "bg-brand-green";
    case "medium": return "bg-yellow-400";
    default: return "bg-red-400";
  }
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
