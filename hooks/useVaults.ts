import { useState, useEffect, useCallback } from "react";
import { fetchVaults, getMockVaults, type Vault, type VaultFilters } from "@/lib/lifi";

interface UseVaultsResult {
  vaults: Vault[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalTVL: number;
  avgAPY: number;
}

export function useVaults(filters: VaultFilters = {}): UseVaultsResult {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVaults(filters);
      setVaults(data.length ? data : getMockVaults());
    } catch (err) {
      setError("Failed to fetch vaults. Showing demo data.");
      setVaults(getMockVaults());
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  const totalTVL = vaults.reduce((s, v) => s + v.tvlUSD, 0);
  const avgAPY = vaults.length ? vaults.reduce((s, v) => s + v.apy, 0) / vaults.length : 0;

  return { vaults, loading, error, refetch: load, totalTVL, avgAPY };
}
