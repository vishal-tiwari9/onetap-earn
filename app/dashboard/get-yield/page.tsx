"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, GitCompare, X, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import type { Vault } from "@/lib/lifi";
import { VaultCard } from "@/components/cards/vault-card";
import { VaultCardSkeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store";
import { useVaults } from "@/hooks/useVaults";
import { cn, formatCurrency, formatAPY } from "@/lib/utils";

const CATEGORIES = ["All", "Lending", "Staking", "LP / DEX", "Yield Aggregator", "Yield Trading"];
const CHAINS = ["All", "Ethereum", "Arbitrum", "Polygon", "Optimism", "Base", "BNB Chain", "Avalanche"];
const ASSETS = ["All", "USDC", "USDT", "DAI", "ETH", "WBTC", "WETH"];
const SORT_OPTIONS = [
  { value: "apy", label: "Highest APY" },
  { value: "tvl", label: "Highest TVL" },
  { value: "risk-low", label: "Lowest Risk" },
];

export default function GetYieldPage() {
  const { vaults, loading, error, refetch, totalTVL, avgAPY, topAPY } = useVaults({ 
  sortBy: "apy" as const 
});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedChain, setSelectedChain] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState("All");
  const [sortBy, setSortBy] = useState("apy");
  const [apyMax, setApyMax] = useState(100);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { selectedVaults, setCompareOpen } = useAppStore();

  const filtered = useMemo(() => {
    let result = [...vaults];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.protocol.toLowerCase().includes(q) ||
        v.asset.symbol.toLowerCase().includes(q) ||
        v.chain.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "All") result = result.filter((v) => v.category === selectedCategory);
    if (selectedChain !== "All") result = result.filter((v) => v.chain === selectedChain);
    if (selectedAsset !== "All") result = result.filter((v) => v.asset.symbol === selectedAsset);
    result = result.filter((v) => v.apy <= apyMax);
    if (sortBy === "apy") result.sort((a, b) => b.apy - a.apy);
    else if (sortBy === "tvl") result.sort((a, b) => b.tvlUSD - a.tvlUSD);
    else if (sortBy === "risk-low") {
      const ord = { Low: 0, Medium: 1, High: 2 };
      result.sort((a, b) => (ord[a.risk as keyof typeof ord] ?? 1) - (ord[b.risk as keyof typeof ord] ?? 1));
    }
    return result;
  }, [vaults, search, selectedCategory, selectedChain, selectedAsset, apyMax, sortBy]);

  const resetFilters = () => {
    setSearch(""); setSelectedCategory("All"); setSelectedChain("All");
    setSelectedAsset("All"); setApyMax(100); setSortBy("apy");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Get Yield</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading
              ? "Fetching live vaults from LI.FI…"
              : error
              ? "Error loading vaults"
              : `${filtered.length} of ${vaults.length} vaults · Avg ${formatAPY(avgAPY)} · Top ${formatAPY(topAPY)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} disabled={loading} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {selectedVaults.length >= 2 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green text-brand-navy rounded-xl font-bold text-sm animate-slide-up green-glow-sm"
            >
              <GitCompare size={16} />
              Compare ({selectedVaults.length})
            </button>
          )}
        </div>
      </div>

      {/* Market summary bar */}
      {!loading && !error && vaults.length > 0 && (
        <div className="flex gap-4 p-3 glass-card rounded-xl border border-white/[0.06] text-xs overflow-x-auto scrollbar-hide">
          {[
            { label: "Total TVL", val: formatCurrency(totalTVL) },
            { label: "Avg APY", val: formatAPY(avgAPY) },
            { label: "Best APY", val: formatAPY(topAPY) },
            { label: "Vaults", val: String(vaults.length) },
            { label: "Filtered", val: String(filtered.length) },
          ].map((item) => (
            <div key={item.label} className="flex-shrink-0">
              <span className="text-muted-foreground">{item.label}: </span>
              <span className="font-bold text-foreground">{item.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
          <button onClick={refetch} className="ml-auto flex items-center gap-1 underline hover:no-underline text-xs">
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* Search + filters bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vaults, protocols, tokens, chains…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-green/40 transition-colors"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
            filtersOpen
              ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
              : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:block">Filters</span>
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
              selectedCategory === cat
                ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* APY slider */}
      <div className="glass-card rounded-xl p-4 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Max APY Filter</span>
          <span className="text-sm text-brand-green font-bold">
            Up to {apyMax >= 100 ? "Any" : formatAPY(apyMax)}
          </span>
        </div>
        <input
          type="range" min={1} max={100} value={apyMax}
          onChange={(e) => setApyMax(Number(e.target.value))}
          className="w-full accent-brand-green"
        />
      </div>

      {/* Expanded filters */}
      {filtersOpen && (
        <div className="glass-card rounded-2xl p-4 border border-white/[0.06] animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Advanced Filters</span>
            <button onClick={() => setFiltersOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Chain</label>
              <div className="flex flex-wrap gap-1.5">
                {CHAINS.map((c) => (
                  <button key={c} onClick={() => setSelectedChain(c)}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                      selectedChain === c
                        ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Asset</label>
              <div className="flex flex-wrap gap-1.5">
                {ASSETS.map((a) => (
                  <button key={a} onClick={() => setSelectedAsset(a)}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                      selectedAsset === a
                        ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground")}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Sort By</label>
              <div className="space-y-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    className={cn("w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      sortBy === opt.value
                        ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground")}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">Reset all filters</button>
        </div>
      )}

      {/* Selection hint */}
      {selectedVaults.length > 0 && selectedVaults.length < 2 && (
        <div className="text-xs text-muted-foreground text-center py-2 border border-dashed border-white/10 rounded-xl">
          Select one more vault to compare · {selectedVaults.length}/4 selected
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <VaultCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold mb-1">{error ? "Failed to load vaults" : "No vaults match"}</p>
          <p className="text-muted-foreground text-sm mb-4">
            {error ? "Check your API key or network" : "Try adjusting your filters"}
          </p>
          <button onClick={error ? refetch : resetFilters} className="text-brand-green text-sm hover:underline">
            {error ? "Retry" : "Reset filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              selectable
              selected={!!selectedVaults.find((v) => v.id === vault.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
