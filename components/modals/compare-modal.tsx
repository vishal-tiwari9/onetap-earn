"use client";

import { X, TrendingUp, Shield, DollarSign } from "lucide-react";
import { useAppStore } from "@/store";
import { formatAPY, formatCurrency, getRiskColor, getRiskDot, generateMockApyHistory, generateMockTvlHistory, cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, CartesianGrid,
} from "recharts";

const COLORS = ["#00D4AA", "#0984E3", "#6C67F1", "#F4A261"];

export function CompareModal() {
  const { compareOpen, setCompareOpen, selectedVaults, clearSelection } = useAppStore();

  if (!compareOpen || selectedVaults.length < 2) return null;

  const vaults = selectedVaults.slice(0, 4);

  // Merge APY history data
  const apyHistories = vaults.map((v) => generateMockApyHistory(v.apy, 30));
  const apyChartData = apyHistories[0].map((point, i) => {
    const row: Record<string, string | number> = { date: point.date };
    vaults.forEach((v, vi) => {
      row[v.protocol] = apyHistories[vi][i]?.apy ?? v.apy;
    });
    return row;
  });

  // TVL comparison bar data
  const tvlData = vaults.map((v) => ({
    name: v.protocol,
    TVL: v.tvlUSD / 1e6,
  }));

  // Risk scores (simple numeric for chart)
  const riskScore = (risk: string) => risk === "Low" ? 1 : risk === "Medium" ? 2 : 3;
  const comparisonData = vaults.map((v) => ({
    name: v.protocol,
    APY: v.apy,
    Risk: riskScore(v.risk || "Medium"),
    "TVL ($M)": v.tvlUSD / 1e6,
  }));

  const handleClose = () => {
    setCompareOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] glass-card rounded-3xl border border-white/[0.08] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">Vault Comparison</h2>
            <p className="text-xs text-muted-foreground">Comparing {vaults.length} vaults</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Side-by-side vault headers */}
          <div className={`grid gap-px bg-white/[0.04] border-b border-white/[0.06]`}
            style={{ gridTemplateColumns: `repeat(${vaults.length}, 1fr)` }}>
            {vaults.map((vault, i) => (
              <div key={vault.id} className="p-4 bg-brand-navy-2">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: `${COLORS[i]}15`, border: `1px solid ${COLORS[i]}25`, color: COLORS[i] }}
                  >
                    {vault.protocol.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{vault.protocol}</div>
                    <div className="text-[10px] text-muted-foreground">{vault.chain}</div>
                  </div>
                </div>
                <div className="text-2xl font-black" style={{ color: COLORS[i] }}>{formatAPY(vault.apy)}</div>
                <div className="text-xs text-muted-foreground">APY</div>
              </div>
            ))}
          </div>

          {/* Stats table */}
          <div className="p-5 space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-white/[0.06]">
                    <th className="pb-2 font-medium">Metric</th>
                    {vaults.map((v, i) => (
                      <th key={v.id} className="pb-2 font-medium" style={{ color: COLORS[i] }}>{v.protocol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[
                    { label: "APY", icon: <TrendingUp size={12} />, format: (v: typeof vaults[0]) => <span className="text-brand-green font-bold">{formatAPY(v.apy)}</span> },
                    { label: "Base APY", icon: null, format: (v: typeof vaults[0]) => formatAPY(v.apyBase || v.apy) },
                    { label: "Reward APY", icon: null, format: (v: typeof vaults[0]) => v.apyReward ? <span className="text-yellow-400">{formatAPY(v.apyReward)}</span> : "—" },
                    { label: "TVL", icon: <DollarSign size={12} />, format: (v: typeof vaults[0]) => formatCurrency(v.tvlUSD) },
                    { label: "Risk", icon: <Shield size={12} />, format: (v: typeof vaults[0]) => (
                      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs", getRiskColor(v.risk || ""))}>
                        <div className={cn("w-1 h-1 rounded-full", getRiskDot(v.risk || ""))} />
                        {v.risk}
                      </span>
                    )},
                    { label: "Category", icon: null, format: (v: typeof vaults[0]) => <span className="text-muted-foreground">{v.category}</span> },
                    { label: "Asset", icon: null, format: (v: typeof vaults[0]) => v.asset.symbol },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-2.5 text-muted-foreground flex items-center gap-1.5">{row.icon}{row.label}</td>
                      {vaults.map((v) => (
                        <td key={v.id} className="py-2.5 font-medium">{row.format(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* APY History Chart */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-brand-green" />APY History (30 days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={apyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip
                    contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {vaults.map((v, i) => (
                    <Line key={v.id} type="monotone" dataKey={v.protocol} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* TVL Bar Chart */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign size={16} className="text-blue-400" />TVL Comparison ($M)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tvlData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`$${v.toFixed(1)}M`, "TVL"]}
                  />
                  <Bar dataKey="TVL" radius={[0, 6, 6, 0]}>
                    {tvlData.map((_, i) => (
                      <rect key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex gap-2 flex-shrink-0">
          <button onClick={() => { clearSelection(); handleClose(); }} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            Clear All
          </button>
          <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl bg-brand-green text-brand-navy text-sm font-bold hover:bg-brand-green-light transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
