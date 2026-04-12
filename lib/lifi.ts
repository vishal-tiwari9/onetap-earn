const LIFI_API_KEY = process.env.NEXT_PUBLIC_LIFI_API_KEY || "18fa9662-5b71-4247-9b20-6302f6144693.4e50203d-2b07-4650-877c-fce0ec21dc56";
const EARN_BASE = "https://earn.li.fi/v1";
const LIFI_BASE = "https://li.quest/v1";

export const lifiHeaders: HeadersInit = {
  "Content-Type": "application/json",
  ...(LIFI_API_KEY ? { "x-lifi-api-key": LIFI_API_KEY } : {}),
};

export interface Vault {
  id: string;
  address: string;
  name: string;
  protocol: string;
  chain: string;
  chainId: number;
  asset: {
    symbol: string;
    address: string;
    decimals: number;
    logoURI?: string;
  };
  apy: number;
  apyBase?: number;
  apyReward?: number;
  tvl: number;
  tvlUSD: number;
  category?: string;
  subcategory?: string;
  description?: string;
  risk?: string;
  logoURI?: string;
}

export interface PortfolioPosition {
  id: string;
  vault: Vault;
  shares: string;
  sharesUSD: number;
  deposited: number;
  currentValue: number;
  earnings: number;
  earnedUSD: number;
  apy: number;
}

export interface VaultFilters {
  chain?: string | number;
  asset?: string;
  protocol?: string;
  category?: string;
  sortBy?: "apy" | "tvl" | "name";
  limit?: number;
  offset?: number;
}

export async function fetchVaults(filters: VaultFilters = {}): Promise<Vault[]> {
  const params = new URLSearchParams();
  if (filters.chain) params.set("chainId", String(filters.chain));
  if (filters.asset) params.set("asset", filters.asset);
  if (filters.protocol) params.set("protocol", filters.protocol);
  if (filters.category) params.set("category", filters.category);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const url = `${EARN_BASE}/earn/vaults${params.toString() ? `?${params}` : ""}`;

  const res = await fetch(url, { headers: lifiHeaders, next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`LI.FI Vaults API: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const raw: unknown[] = Array.isArray(data) ? data : data.vaults ?? data.data ?? [];
  return raw.map((v) => normalizeVault(v as Record<string, unknown>));
}

export async function fetchPortfolioPositions(wallet: string): Promise<PortfolioPosition[]> {
  const res = await fetch(`${EARN_BASE}/earn/portfolio/${wallet}/positions`, {
    headers: lifiHeaders,
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Portfolio API: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.positions ?? [];
}

export async function getLifiQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
}) {
  const qs = new URLSearchParams({
    fromChain: String(params.fromChain),
    toChain: String(params.toChain),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    integrator: "onetap-earn",
  });
  const res = await fetch(`${LIFI_BASE}/quote?${qs}`, { headers: lifiHeaders });
  if (!res.ok) throw new Error(`Quote API: ${res.status}`);
  return res.json();
}

function normalizeVault(v: Record<string, unknown>): Vault {
  const asset = (v.asset ?? {}) as Record<string, unknown>;
  const rawApy = Number(v.apy ?? 0);
  const apy = rawApy > 0 && rawApy < 1 ? rawApy * 100 : rawApy;
  const rawApyBase = v.apyBase != null ? Number(v.apyBase) : undefined;
  const apyBase = rawApyBase != null ? (rawApyBase > 0 && rawApyBase < 1 ? rawApyBase * 100 : rawApyBase) : undefined;
  const rawApyReward = v.apyReward != null ? Number(v.apyReward) : undefined;
  const apyReward = rawApyReward != null ? (rawApyReward > 0 && rawApyReward < 1 ? rawApyReward * 100 : rawApyReward) : undefined;
  const tvlUSD = Number(v.tvlUSD ?? v.tvl ?? 0);
  return {
    id: String(v.id ?? v.address ?? Math.random()),
    address: String(v.address ?? ""),
    name: String(v.name ?? v.protocol ?? "Unknown Vault"),
    protocol: String(v.protocol ?? v.protocolName ?? "Unknown"),
    chain: String(v.chain ?? v.chainName ?? "Unknown"),
    chainId: Number(v.chainId ?? 1),
    asset: {
      symbol: String(asset.symbol ?? v.symbol ?? "USDC"),
      address: String(asset.address ?? ""),
      decimals: Number(asset.decimals ?? 6),
      logoURI: asset.logoURI as string | undefined,
    },
    apy,
    apyBase,
    apyReward,
    tvl: Number(v.tvl ?? 0),
    tvlUSD,
    category: String(v.category ?? "Lending"),
    subcategory: v.subcategory as string | undefined,
    description: v.description as string | undefined,
    risk: getRiskLevel(tvlUSD, apy),
    logoURI: (v.logoURI ?? v.protocolLogoURI) as string | undefined,
  };
}

function getRiskLevel(tvl: number, apy: number): string {
  if (tvl > 100_000_000 && apy < 15) return "Low";
  if (tvl > 10_000_000 && apy < 30) return "Medium";
  return "High";
}

export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
  56: "BNB Chain",
  43114: "Avalanche",
};

export const CHAIN_LOGOS: Record<number, string> = {
  1: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  137: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  42161: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  10: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  8453: "https://assets.coingecko.com/coins/images/28448/small/cbeth.png",
  56: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  43114: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
};
