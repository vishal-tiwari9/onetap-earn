"use client";

import { X, TrendingUp, Shield, DollarSign } from "lucide-react";
import { useAppStore } from "@/store";
import { CHAIN_NAMES, type Vault } from "@/lib/lifi";
import { formatAPY, formatCurrency, getRiskColor, getRiskDot, cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend,
} from "recharts";

const COLORS = ["#00D4AA", "#0984E3", "#6C67F1", "#F4A261"];

// Generate simulated APY history around vault's real APY
function mockApyHistory(baseApy: number, days = 20) {
  return Array.from({ length: days }, (_, i) => ({
    d: `D${i + 1}`,
    apy: Math.max(0, baseApy + (Math.random() - 0.5) * Math.min(baseApy * 0.3, 2)),
  }));
}

export function CompareModal() {
  const { compareOpen, setCompareOpen, selectedVaults, clearSelection } = useAppStore();
  if (!compareOpen || selectedVaults.length < 2) return null;
  const vaults = selectedVaults.slice(0, 4);

  // Merge APY histories per protocol
  const histories = vaults.map((v) => mockApyHistory(v.apy));
  const chartData = histories[0].map((pt, i) => {
    const row: Record<string, string | number> = { d: pt.d };
    vaults.forEach((v, vi) => { row[v.protocol] = parseFloat((histories[vi][i]?.apy ?? v.apy).toFixed(2)); });
    return row;
  });

  const tvlData = vaults.map((v, i) => ({
    name: v.protocol,
    TVL_M: parseFloat((v.tvlUSD / 1e6).toFixed(2)),
    APY: parseFloat(v.apy.toFixed(2)),
    fill: COLORS[i],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCompareOpen(false)} />
      <div className="relative w-full max-w-5xl max-h-[90vh] glass-card rounded-3xl border border-white/[0.08] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">Vault Comparison</h2>
            <p className="text-xs text-muted-foreground">Comparing {vaults.length} vaults · Live LI.FI data</p>
          </div>
          <button onClick={() => setCompareOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Vault headers */}
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${vaults.length}, 1fr)` }}>
            {vaults.map((vault, i) => (
              <div key={vault.id} className="p-4 glass-card rounded-2xl border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: `${COLORS[i]}15`, border: `1px solid ${COLORS[i]}30`, color: COLORS[i] }}>
                    {vault.protocol.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{vault.protocol}</div>
                    <div className="text-[10px] text-muted-foreground">{CHAIN_NAMES[vault.chainId] || vault.chain}</div>
                  </div>
                </div>
                <div className="text-2xl font-black" style={{ color: COLORS[i] }}>{formatAPY(vault.apy)}</div>
                <div className="text-xs text-muted-foreground">APY</div>
                <div className="text-sm font-semibold mt-1">{vault.tvlUSD > 0 ? formatCurrency(vault.tvlUSD) : "—"} TVL</div>
              </div>
            ))}
          </div>

          {/* Stats table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-white/[0.06]">
                  <th className="pb-2 font-medium w-32">Metric</th>
                  {vaults.map((v, i) => (
                    <th key={v.id} className="pb-2 font-medium" style={{ color: COLORS[i] }}>{v.protocol}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { label: "APY", icon: <TrendingUp size={11} />, fn: (v: Vault) => <span className="text-brand-green font-bold">{formatAPY(v.apy)}</span> },
                  { label: "Base APY", icon: null, fn: (v: Vault) => formatAPY(v.apyBase ?? v.apy) },
                  { label: "Reward APY", icon: null, fn: (v: Vault) => v.apyReward && v.apyReward > 0 ? <span className="text-yellow-400">{formatAPY(v.apyReward)}</span> : "—" },
                  { label: "TVL", icon: <DollarSign size={11} />, fn: (v: Vault) => v.tvlUSD > 0 ? formatCurrency(v.tvlUSD) : "—" },
                  { label: "Risk", icon: <Shield size={11} />, fn: (v: Vault) => (
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs", getRiskColor(v.risk))}>
                      <div className={cn("w-1 h-1 rounded-full", getRiskDot(v.risk))} />
                      {v.risk}
                    </span>
                  )},
                  { label: "Chain", icon: null, fn: (v: Vault) => <span className="text-muted-foreground">{CHAIN_NAMES[v.chainId] || v.chain}</span> },
                  { label: "Asset", icon: null, fn: (v: Vault) => v.asset.symbol },
                  { label: "Category", icon: null, fn: (v: Vault) => <span className="text-muted-foreground">{v.category}</span> },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-2.5 text-muted-foreground text-xs flex items-center gap-1">{row.icon}{row.label}</td>
                    {vaults.map((v) => <td key={v.id} className="py-2.5 font-medium text-sm">{row.fn(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* APY History */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <TrendingUp size={15} className="text-brand-green" />APY Trend (simulated from live APY)
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <Tooltip contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {vaults.map((v, i) => (
                  <Line key={v.id} type="monotone" dataKey={v.protocol} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TVL + APY bar */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <DollarSign size={15} className="text-blue-400" />TVL & APY Comparison
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={tvlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8896B0" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="tvl" orientation="left" tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <YAxis yAxisId="apy" orientation="right" tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                <Bar yAxisId="tvl" dataKey="TVL_M" name="TVL ($M)" radius={[4, 4, 0, 0]} fill="#0984E3" opacity={0.8} />
                <Bar yAxisId="apy" dataKey="APY" name="APY (%)" radius={[4, 4, 0, 0]} fill="#00D4AA" opacity={0.8} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 border-t border-white/[0.06] flex gap-2 flex-shrink-0">
          <button onClick={() => { clearSelection(); setCompareOpen(false); }}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            Clear All
          </button>
          <button onClick={() => setCompareOpen(false)}
            className="flex-1 py-2.5 rounded-xl bg-brand-green text-brand-navy text-sm font-bold hover:bg-brand-green-light transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
