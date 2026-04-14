const LIFI_API_KEY = process.env.NEXT_PUBLIC_LIFI_API_KEY || "18fa9662-5b71-4247-9b20-6302f6144693.4e50203d-2b07-4650-877c-fce0ec21dc56";
const EARN_BASE = "https://earn.li.fi/v1/earn";
const LIFI_BASE = "https://li.quest/v1";
const LLAMA_BASE = "https://yields.llama.fi";

export const lifiHeaders: HeadersInit = {
  "Content-Type": "application/json",
  "x-lifi-api-key": LIFI_API_KEY,
};

export interface Vault {
  id: string;
  address: string;
  name: string;
  protocol: string;
  protocolId: string;
  chain: string;
  chainId: number;
  asset: {
    symbol: string;
    address: string;
    decimals: number;
    logoURI?: string;
    name?: string;
  };
  apy: number;
  apyBase?: number;
  apyReward?: number;
  tvlUSD: number;
  category: string;
  subcategory?: string;
  description?: string;
  risk: string;
  logoURI?: string;
  sortBy?: "apy" | "tvl" | "risk-low";  
}

export interface PortfolioPosition {
  id: string;
  vault: Vault;
  shares: string;
  sharesUSD: number;
  deposited: number;
  currentValue: number;
  earnedUSD: number;
  apy: number;
}

export interface VaultFilters {
  chainId?: number;
  asset?: string;
  protocol?: string;
  category?: string;
  limit?: number;
  SortBy?: "apy" | "tvl" | "risk-low";
}

// Deep-extract a string from any nested value
function extractString(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    // Common name fields
    for (const k of ["name", "symbol", "id", "key", "slug", "label", "title"]) {
      if (typeof obj[k] === "string" && obj[k]) return obj[k] as string;
    }
    return fallback;
  }
  return fallback;
}

// Extract a number robustly, converting decimal fraction to percent if needed
function extractAPY(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  if (isNaN(n)) return 0;
  // LI.FI returns APY as decimal fraction (0.084 = 8.4%) or as percent (8.4)
  // Heuristic: if < 1 and > 0, it's a decimal fraction
  if (n > 0 && n < 1) return parseFloat((n * 100).toFixed(4));
  return parseFloat(n.toFixed(4));
}

function extractNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function getRisk(tvl: number, apy: number): string {
  if (tvl > 100_000_000 && apy < 15) return "Low";
  if (tvl > 10_000_000 && apy < 30) return "Medium";
  return "High";
}

// The LI.FI API can return protocol as string OR as object {name, id, logoURI, ...}
function normalizeVault(raw: Record<string, unknown>): Vault {
  const analytics = (raw.analytics ?? {}) as Record<string, unknown>;
  const apyObj = (analytics.apy ?? {}) as Record<string, unknown>;

  // APY (real path)
  const apy = extractAPY(apyObj.total ?? apyObj.base ?? raw.apy);

  // TVL (real path)
  const tvlObj = (analytics.tvl ?? {}) as Record<string, unknown>;
  const tvlUSD = extractNumber(tvlObj.usd ?? raw.tvlUSD ?? raw.tvl);

  // Protocol
  const protocolRaw = raw.protocol ?? {};
  const protocolName = extractString(
    typeof protocolRaw === "object" ? (protocolRaw as any).name : protocolRaw,
    "Unknown"
  );

  // Chain
  const chainName = extractString(raw.network ?? raw.chain, "Unknown");
  const chainId = extractNumber(raw.chainId) || mapChainNameToId(chainName);

  // Asset
  const underlying = Array.isArray(raw.underlyingTokens) 
    ? raw.underlyingTokens[0] 
    : (raw.asset ?? raw.token ?? {});
  
  const assetSymbol = extractString((underlying as any).symbol ?? (underlying as any).name, "—");

  return {
    id: extractString(raw.id ?? raw.address ?? raw.slug, Math.random().toString(36).slice(2)),
    address: extractString(raw.address ?? raw.contractAddress, ""),
    name: extractString(raw.name ?? raw.slug, protocolName),
    protocol: protocolName,
    protocolId: protocolName.toLowerCase(),
    chain: chainName,
    chainId,
    asset: {
      symbol: assetSymbol,
      address: extractString((underlying as any).address, ""),
      decimals: extractNumber((underlying as any).decimals) || 18,
      logoURI: undefined,
      name: assetSymbol,
    },
    apy,
    apyBase: extractAPY(apyObj.base),
    apyReward: extractAPY(apyObj.reward),
    tvlUSD,
    category: extractString(raw.category ?? "Lending"),
    subcategory: undefined,
    description: extractString(raw.description),
    risk: getRisk(tvlUSD, apy),
    logoURI: undefined,
  };
}

function mapChainNameToId(name: string): number {
  const map: Record<string, number> = {
    ethereum: 1, eth: 1, mainnet: 1,
    polygon: 137, matic: 137,
    arbitrum: 42161, arb: 42161,
    optimism: 10, op: 10,
    base: 8453,
    bsc: 56, "bnb chain": 56, binance: 56,
    avalanche: 43114, avax: 43114,
    gnosis: 100, xdai: 100,
    linea: 59144,
    scroll: 534352,
    zksync: 324,
    mantle: 5000,
  };
  return map[name.toLowerCase()] || 1;
}

export async function fetchVaults(filters: VaultFilters = {}): Promise<Vault[]> {
  const params = new URLSearchParams();
  if (filters.chainId) params.set("chainId", String(filters.chainId));
  if (filters.asset) params.set("asset", filters.asset);
  if (filters.protocol) params.set("protocol", filters.protocol);
  if (filters.category) params.set("category", filters.category);
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();
  const url = `${EARN_BASE}/vaults${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { 
    headers: lifiHeaders, 
    next: { revalidate: 60 } 
  });

  if (!res.ok) throw new Error(`LI.FI vaults API ${res.status}: ${res.statusText}`);

  const json = await res.json();
  
  // IMPORTANT: LI.FI returns { data: [...] }
  const raw: unknown[] = Array.isArray(json) 
    ? json 
    : json.data ?? json.vaults ?? json.result ?? [];

  const vaults = raw.map((v) => normalizeVault(v as Record<string, unknown>));
  
  return vaults.sort((a, b) => b.apy - a.apy);
}

export async function fetchPortfolioPositions(wallet: string): Promise<PortfolioPosition[]> {
  const res = await fetch(`${EARN_BASE}/portfolio/${wallet}/positions`, {
    headers: lifiHeaders,
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Portfolio API ${res.status}`);
  const data = await res.json();
  const raw: unknown[] = Array.isArray(data) ? data : data.positions ?? [];
  return raw.map((p) => normalizePosition(p as Record<string, unknown>));
}

function normalizePosition(p: Record<string, unknown>): PortfolioPosition {
  const vaultRaw = (p.vault ?? p.position ?? p) as Record<string, unknown>;
  return {
    id: extractString(p.id ?? p.positionId, Math.random().toString(36).slice(2)),
    vault: normalizeVault(vaultRaw),
    shares: extractString(p.shares ?? p.balance, "0"),
    sharesUSD: extractNumber(p.sharesUSD ?? p.balanceUSD ?? p.valueUSD),
    deposited: extractNumber(p.deposited ?? p.principal ?? p.invested),
    currentValue: extractNumber(p.currentValue ?? p.value ?? p.sharesUSD ?? p.balanceUSD),
    earnedUSD: extractNumber(p.earnedUSD ?? p.earnings ?? p.yield),
    apy: extractAPY(p.apy ?? vaultRaw.apy),
  };
}

export async function getLifiQuote(params: {
  fromChain: number; toChain: number;
  fromToken: string; toToken: string;
  fromAmount: string; fromAddress: string;
}) {
  const qs = new URLSearchParams({
    fromChain: String(params.fromChain), toChain: String(params.toChain),
    fromToken: params.fromToken, toToken: params.toToken,
    fromAmount: params.fromAmount, fromAddress: params.fromAddress,
    integrator: "onetap-earn",
  });
  const res = await fetch(`${LIFI_BASE}/quote?${qs}`, { headers: lifiHeaders });
  if (!res.ok) throw new Error(`Quote API ${res.status}`);
  return res.json();
}

// Fetch APY history from DefiLlama for a protocol/pool
export async function fetchDefiLlamaPoolHistory(llamaPoolId: string) {
  try {
    const res = await fetch(`${LLAMA_BASE}/chart/${llamaPoolId}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as { timestamp: string; apy: number; tvlUsd: number }[];
  } catch {
    return null;
  }
}

export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 137: "Polygon", 42161: "Arbitrum",
  10: "Optimism", 8453: "Base", 56: "BNB Chain",
  43114: "Avalanche", 100: "Gnosis", 59144: "Linea",
  534352: "Scroll", 324: "zkSync", 5000: "Mantle",
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
