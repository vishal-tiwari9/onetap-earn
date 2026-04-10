import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals = 2): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(decimals)}`;
}

export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getRiskColor(risk: string): string {
  switch (risk?.toLowerCase()) {
    case "low": return "text-brand-green bg-brand-green/10 border-brand-green/20";
    case "medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "high": return "text-red-400 bg-red-400/10 border-red-400/20";
    default: return "text-muted-foreground bg-muted border-border";
  }
}

export function getRiskDot(risk: string): string {
  switch (risk?.toLowerCase()) {
    case "low": return "bg-brand-green";
    case "medium": return "bg-yellow-400";
    case "high": return "bg-red-400";
    default: return "bg-muted-foreground";
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateMockApyHistory(baseApy: number, days = 30) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    apy: Math.max(0, baseApy + (Math.random() - 0.5) * 3),
  }));
}

export function generateMockTvlHistory(baseTvl: number, days = 30) {
  let tvl = baseTvl * 0.7;
  return Array.from({ length: days }, (_, i) => {
    tvl = tvl + (Math.random() - 0.4) * (baseTvl * 0.02);
    return {
      date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tvl: Math.max(0, tvl),
    };
  });
}
