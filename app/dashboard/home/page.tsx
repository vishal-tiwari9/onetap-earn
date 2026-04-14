"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Wallet, ArrowRight, Zap, Bot, ChevronRight,
  Activity, RefreshCw, AlertCircle, Globe, DollarSign,
} from "lucide-react";
import { formatCurrency, formatAddress, formatAPY } from "@/lib/utils";
import { fetchVaults, type Vault } from "@/lib/lifi";
import { VaultCard } from "@/components/cards/vault-card";
import { Skeleton, VaultCardSkeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface MarketStats {
  totalTVL: number;
  avgApy: number;
  topApy: number;
  vaultCount: number;
  chainCount: number;
}

export default function DashboardHome() {
  const { address } = useAccount();
  const router = useRouter();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVaults({ SortBy: "apy" });
      setVaults(data);

      const totalTVL = data.reduce((s, v) => s + v.tvlUSD, 0);
      const avgApy = data.reduce((s, v) => s + v.apy, 0) / (data.length || 1);
      const topApy = Math.max(...data.map((v) => v.apy));
      const chains = new Set(data.map((v) => v.chainId)).size;

      setStats({ totalTVL, avgApy, topApy, vaultCount: data.length, chainCount: chains });
      setLastUpdated(new Date());
    } catch (e) {
      setError("Unable to load live vault data. Check your network.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const topVaults = [...vaults].sort((a, b) => b.apy - a.apy).slice(0, 3);
  const lowRiskVaults = vaults.filter((v) => v.risk === "Low").slice(0, 3);

  // APY distribution for bar chart — bucket vaults by APY range
  const apyBuckets = [
    { range: "0–5%", count: 0 },
    { range: "5–10%", count: 0 },
    { range: "10–20%", count: 0 },
    { range: "20%+", count: 0 },
  ];
  vaults.forEach((v) => {
    if (v.apy < 5) apyBuckets[0].count++;
    else if (v.apy < 10) apyBuckets[1].count++;
    else if (v.apy < 20) apyBuckets[2].count++;
    else apyBuckets[3].count++;
  });

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  vaults.forEach((v) => {
    const cat = v.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, <span className="gradient-text">{address ? formatAddress(address) : "anon"}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live DeFi market overview · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => router.push("/dashboard/get-yield")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-green text-brand-navy rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-all green-glow-sm"
          >
            <Zap size={16} />
            Earn Now
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button onClick={load} className="ml-auto underline hover:no-underline text-xs">Retry</button>
        </div>
      )}

      {/* Mobile CTA */}
      <button
        onClick={() => router.push("/dashboard/get-yield")}
        className="sm:hidden w-full flex items-center justify-between p-4 bg-brand-green/10 border border-brand-green/20 rounded-2xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/20 flex items-center justify-center">
            <Zap size={20} className="text-brand-green" />
          </div>
          <div className="text-left">
            <div className="font-bold text-brand-green">Start Earning</div>
            <div className="text-xs text-muted-foreground">
              {loading ? "Loading live vaults..." : `${vaults.length} vaults available`}
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="text-brand-green group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Live Market Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : stats ? (
          <>
            {[
              { label: "Total TVL", value: formatCurrency(stats.totalTVL), icon: <DollarSign size={16} />, sub: `${stats.vaultCount} vaults`, color: "text-brand-green" },
              { label: "Avg APY", value: formatAPY(stats.avgApy), icon: <TrendingUp size={16} />, sub: "Across all vaults", color: "text-blue-400" },
              { label: "Top APY", value: formatAPY(stats.topApy), icon: <Activity size={16} />, sub: "Best rate now", color: "text-yellow-400" },
              { label: "Chains", value: String(stats.chainCount), icon: <Globe size={16} />, sub: "Supported chains", color: "text-purple-400" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <span className={`${stat.color} opacity-60`}>{stat.icon}</span>
                </div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{stat.sub}</div>
              </div>
            ))}
          </>
        ) : null}
      </div>

      {/* Charts row */}
      <div className="grid sm:grid-cols-5 gap-4">
        {/* APY Distribution chart */}
        <div className="sm:col-span-3 glass-card rounded-2xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">APY Distribution</div>
              <div className="text-xs text-muted-foreground">Live vaults by yield range</div>
            </div>
            {!loading && stats && (
              <div className="text-right">
                <div className="text-brand-green font-bold text-sm">{stats.vaultCount} vaults</div>
                <div className="text-xs text-muted-foreground">tracked live</div>
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-28 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={apyBuckets} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#8896B0" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8896B0" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v} vaults`, "Count"]}
                />
                <Bar dataKey="count" fill="#00D4AA" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* AI CTA */}
        <div
          onClick={() => router.push("/dashboard/ask-ai")}
          className="sm:col-span-2 glass-card rounded-2xl p-5 border border-white/[0.06] cursor-pointer group hover:border-purple-500/20 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot size={24} className="text-purple-400" />
            </div>
            <div className="font-semibold mb-1">Ask AI Advisor</div>
            <div className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Get personalized yield picks from live data — in English or Hinglish.
            </div>
          </div>
          {!loading && stats && (
            <div className="text-xs text-muted-foreground mb-3">
              AI has access to <span className="text-purple-400 font-medium">{stats.vaultCount} live vaults</span> right now
            </div>
          )}
          <div className="flex items-center gap-1 text-purple-400 text-sm font-medium">
            Chat Now <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {!loading && categoryData.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
          <div className="font-semibold mb-3 text-sm">Vault Categories</div>
          <div className="space-y-2">
            {categoryData.map((cat) => {
              const pct = Math.round((cat.count / vaults.length) * 100);
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-muted-foreground truncate">{cat.name}</div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground w-12 text-right">{cat.count} ({pct}%)</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Vaults by APY */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">🏆 Top APY Vaults</h2>
            <p className="text-xs text-muted-foreground">Highest yielding right now</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/get-yield")}
            className="text-brand-green text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            See all <ArrowRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            : topVaults.map((vault) => <VaultCard key={vault.id} vault={vault} compact />)}
        </div>
      </div>

      {/* Low Risk vaults */}
      {!loading && lowRiskVaults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">🛡️ Safest Picks</h2>
              <p className="text-xs text-muted-foreground">Low risk · High TVL · Battle-tested</p>
            </div>
          </div>
          <div className="space-y-3">
            {lowRiskVaults.map((vault) => <VaultCard key={vault.id} vault={vault} compact />)}
          </div>
        </div>
      )}
    </div>
  );
}
