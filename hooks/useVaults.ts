import { useState, useEffect, useCallback } from "react";
import { fetchVaults, type Vault, type VaultFilters } from "@/lib/lifi";

interface UseVaultsResult {
  vaults: Vault[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalTVL: number;
  avgAPY: number;
  topAPY: number;
  sortBy?: "apy" | "tvl" | "risk-low";   
}

export function useVaults(filters: VaultFilters = {}): UseVaultsResult {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVaults(filters);
      setVaults(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load vaults";
      setError(msg);
      setVaults([]);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { load(); }, [load]);

  const totalTVL = vaults.reduce((s, v) => s + v.tvlUSD, 0);
  const avgAPY = vaults.length ? vaults.reduce((s, v) => s + v.apy, 0) / vaults.length : 0;
  const topAPY = vaults.length ? Math.max(...vaults.map((v) => v.apy)) : 0;

  return { vaults, loading, error, refetch: load, totalTVL, avgAPY, topAPY };
}
