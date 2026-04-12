"use client";

import { Bot, TrendingUp, CheckSquare, Square } from "lucide-react";
import { cn, formatCurrency, formatAPY, getRiskColor, getRiskDot } from "@/lib/utils";
import type { Vault } from "@/lib/lifi";
import { CHAIN_NAMES } from "@/lib/lifi";
import { useAppStore } from "@/store";

interface VaultCardProps {
  vault: Vault;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
}

const PROTOCOL_COLORS: Record<string, string> = {
  "aave": "#B6509E", "aave v3": "#B6509E", "aave v2": "#B6509E",
  "compound": "#00D395", "compound v3": "#00D395",
  "lido": "#F4A261", "spark": "#E85425",
  "uniswap": "#FF007A", "uniswap v3": "#FF007A",
  "makerdao": "#1AAB9B", "sky": "#1AAB9B",
  "pendle": "#6C67F1", "yearn": "#006AE3",
  "curve": "#3466FF", "convex": "#FF5500",
  "morpho": "#2470FF", "euler": "#E75131",
  "fluid": "#00B4D8", "beefy": "#2D9B27",
};

function getProtocolColor(protocol: string): string {
  const key = (protocol || "").toLowerCase();
  for (const [k, v] of Object.entries(PROTOCOL_COLORS)) {
    if (key.includes(k)) return v;
  }
  // Generate deterministic color from name
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

function getInitials(name: string): string {
  if (!name || name === "Unknown") return "?";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function VaultCard({ vault, compact = false, selectable = false, selected = false }: VaultCardProps) {
  const { openDeposit, openCopilot, toggleVaultSelection } = useAppStore();
  const color = getProtocolColor(vault.protocol);
  const chainName = CHAIN_NAMES[vault.chainId] || vault.chain || "Unknown";

  if (compact) {
    return (
      <div className="glass-card rounded-xl p-4 border border-white/[0.06] flex items-center justify-between group hover:border-brand-green/20 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: `${color}20`, border: `1px solid ${color}30`, color }}>
            {getInitials(vault.protocol)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate max-w-[180px]">{vault.name}</div>
            <div className="text-xs text-muted-foreground">{vault.protocol} · {chainName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-brand-green font-bold">{formatAPY(vault.apy)}</div>
            <div className="text-xs text-muted-foreground">APY</div>
          </div>
          <button onClick={() => openDeposit(vault)}
            className="px-3 py-1.5 bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-semibold rounded-lg hover:bg-brand-green/20 transition-colors">
            Deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-2xl p-5 border transition-all duration-200",
      selected ? "border-brand-green/40 bg-brand-green/5" : "border-white/[0.06] hover:border-white/[0.12]")}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectable && (
            <button onClick={() => toggleVaultSelection(vault)} className="text-muted-foreground hover:text-brand-green transition-colors mt-0.5 flex-shrink-0">
              {selected ? <CheckSquare size={18} className="text-brand-green" /> : <Square size={18} />}
            </button>
          )}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}>
            {getInitials(vault.protocol)}
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate max-w-[160px]" title={vault.name}>{vault.name}</div>
            <div className="text-xs text-muted-foreground">{vault.protocol}</div>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0", getRiskColor(vault.risk))}>
          <div className={cn("w-1.5 h-1.5 rounded-full", getRiskDot(vault.risk))} />
          {vault.risk}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/[0.03] rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1">APY</div>
          <div className="text-xl font-black text-brand-green">{formatAPY(vault.apy)}</div>
          {vault.apyReward && vault.apyReward > 0 && (
            <div className="text-[10px] text-yellow-400 mt-0.5">+{formatAPY(vault.apyReward)} rewards</div>
          )}
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1">TVL</div>
          <div className="text-sm font-bold">{vault.tvlUSD > 0 ? formatCurrency(vault.tvlUSD) : "—"}</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1">Chain</div>
          <div className="text-sm font-semibold truncate">{chainName}</div>
          <div className="text-[10px] text-muted-foreground">{vault.asset.symbol}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{vault.category}</span>
        {vault.asset.symbol && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{vault.asset.symbol}</span>
        )}
      </div>

      {vault.description && (
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">{vault.description}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => openDeposit(vault)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-green text-brand-navy rounded-xl font-bold text-sm hover:bg-brand-green-light transition-all green-glow-sm">
          <TrendingUp size={15} /> Deposit
        </button>
        <button onClick={() => openCopilot(vault)}
          className="px-3 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/15 transition-colors"
          title="Ask AI about this vault">
          <Bot size={16} />
        </button>
      </div>
    </div>
  );
}
