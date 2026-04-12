"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  TrendingUp, Wallet, DollarSign, BarChart3,
  Loader2, ArrowUpRight, AlertCircle, RefreshCw,
} from "lucide-react";
import { fetchPortfolioPositions, type PortfolioPosition } from "@/lib/lifi";
import { formatCurrency, formatAPY } from "@/lib/utils";
import { useAppStore } from "@/store";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const PIE_COLORS = ["#00D4AA", "#0984E3", "#6C67F1", "#F4A261", "#FF007A"];

// Simulate realistic cumulative earnings curve from positions data
function buildGrowthData(positions: PortfolioPosition[]) {
  const totalDeposited = positions.reduce((s, p) => s + p.deposited, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.currentValue, 0);
  const avgApy = positions.length
    ? positions.reduce((s, p) => s + p.apy, 0) / positions.length
    : 0;
  const dailyRate = avgApy / 100 / 365;
  const days = 30;
  return Array.from({ length: days }, (_, i) => ({
    day: `Day ${i + 1}`,
    value: parseFloat((totalDeposited * Math.pow(1 + dailyRate, i)).toFixed(2)),
    invested: totalDeposited,
  })).concat([{
    day: "Today",
    value: totalCurrent,
    invested: totalDeposited,
  }]);
}

export default function PortfolioPage() {
  const { address } = useAccount();
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openDeposit } = useAppStore();

  const load = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortfolioPositions(address);
      setPositions(data);
    } catch (e) {
      console.error(e);
      setError("Could not load portfolio data from LI.FI. You may not have any active positions yet.");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [address]);

  const totalInvested = positions.reduce((s, p) => s + p.deposited, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalEarned = positions.reduce((s, p) => s + p.earnedUSD, 0);
  const avgApy = positions.length
    ? positions.reduce((s, p) => s + p.apy, 0) / positions.length
    : 0;
  const totalGainPct = totalInvested > 0
    ? ((totalCurrent - totalInvested) / totalInvested) * 100
    : 0;

  const pieData = positions.map((p) => ({
    name: p.vault.asset.symbol,
    value: p.currentValue,
    protocol: p.vault.protocol,
  }));

  const growthData = positions.length > 0 ? buildGrowthData(positions) : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={32} className="text-brand-green animate-spin" />
        <p className="text-muted-foreground text-sm">
          Fetching your positions from LI.FI…
        </p>
        <p className="text-xs text-muted-foreground">{address?.slice(0, 10)}…</p>
      </div>
    );
  }

  if (error || positions.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        {error ? (
          <>
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
              <AlertCircle size={24} className="text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold">No Positions Found</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 text-sm text-brand-green hover:underline"
            >
              <RefreshCw size={13} /> Try again
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-2">💼</div>
            <h2 className="text-xl font-bold">No active positions</h2>
            <p className="text-muted-foreground text-sm">
              Deposit into a vault to start earning yield.
            </p>
          </>
        )}
        <a
          href="/dashboard/get-yield"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green text-brand-navy rounded-xl font-bold hover:bg-brand-green-light transition-all green-glow-sm"
        >
          Browse Vaults <ArrowUpRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {positions.length} active position{positions.length !== 1 ? "s" : ""} · Live from LI.FI
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Value", value: formatCurrency(totalCurrent),
            sub: `${totalGainPct >= 0 ? "+" : ""}${totalGainPct.toFixed(2)}% all time`,
            positive: totalGainPct >= 0, icon: <Wallet size={16} />, color: "text-brand-green",
          },
          {
            label: "Invested", value: formatCurrency(totalInvested),
            sub: "Principal deposited", positive: true, icon: <DollarSign size={16} />, color: "text-blue-400",
          },
          {
            label: "Earned", value: formatCurrency(totalEarned),
            sub: "Yield earned", positive: true, icon: <TrendingUp size={16} />, color: "text-brand-green",
          },
          {
            label: "Avg APY", value: formatAPY(avgApy),
            sub: `${positions.length} positions`, positive: true, icon: <BarChart3 size={16} />, color: "text-purple-400",
          },
        ].map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <span className={`${card.color} opacity-70`}>{card.icon}</span>
            </div>
            <div className="text-xl font-black">{card.value}</div>
            <div className={`text-xs mt-1 ${card.positive ? "text-brand-green" : "text-red-400"}`}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid sm:grid-cols-5 gap-4">
        <div className="sm:col-span-3 glass-card rounded-2xl p-4 border border-white/[0.06]">
          <div className="font-semibold mb-1">Portfolio Growth</div>
          <div className="text-xs text-muted-foreground mb-4">Projected based on your actual APY</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#8896B0" }} tickLine={false} axisLine={false} interval={7} />
              <YAxis tick={{ fontSize: 10, fill: "#8896B0" }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
              />
              <Line type="monotone" dataKey="value" stroke="#00D4AA" strokeWidth={2} dot={false} name="Value" />
              <Line type="monotone" dataKey="invested" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}
                dot={false} strokeDasharray="4 4" name="Invested" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="sm:col-span-2 glass-card rounded-2xl p-4 border border-white/[0.06]">
          <div className="font-semibold mb-1">Allocation</div>
          <div className="text-xs text-muted-foreground mb-4">By current value</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v), ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name} · {item.protocol}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positions */}
      <div>
        <h2 className="font-bold text-lg mb-4">Your Positions</h2>
        <div className="space-y-3">
          {positions.map((position) => {
            const gain = position.currentValue - position.deposited;
            return (
              <div
                key={position.id}
                className="glass-card rounded-2xl p-4 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-brand-green/10 flex items-center justify-center text-sm font-bold text-brand-green border border-brand-green/20">
                    {position.vault.protocol.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{position.vault.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {position.vault.protocol} · {position.vault.chain}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 sm:gap-6 text-sm">
                  {[
                    { label: "Deposited", val: formatCurrency(position.deposited), color: "" },
                    { label: "Current", val: formatCurrency(position.currentValue), color: "" },
                    { label: "Earned", val: `+${formatCurrency(position.earnedUSD)}`, color: "text-brand-green" },
                    { label: "APY", val: formatAPY(position.apy), color: "text-brand-green" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                      <div className={`font-semibold ${item.color}`}>{item.val}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDeposit(position.vault)}
                    className="px-3 py-1.5 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-semibold hover:bg-brand-green/20 transition-colors"
                  >
                    Add
                  </button>
                  <button className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/10 transition-colors">
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
