const LIFI_API_KEY = process.env.NEXT_PUBLIC_LIFI_API_KEY || "";
const EARN_BASE = "https://earn.li.fi/v1";
const LIFI_BASE = "https://li.quest/v1";

const headers: HeadersInit = {
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
  underlyingTokens?: string[];
  rewards?: { token: string; apy: number }[];
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
  minApy?: number;
  maxApy?: number;
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

  try {
    const res = await fetch(url, { headers, next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`LI.FI Vaults API error: ${res.status}`);
    const data = await res.json();
    // API returns array directly or nested
    const vaults = Array.isArray(data) ? data : data.vaults || data.data || [];
    return vaults.map(normalizeVault);
  } catch (err) {
    console.error("fetchVaults error:", err);
    return getMockVaults();
  }
}

export async function fetchPortfolioPositions(wallet: string): Promise<PortfolioPosition[]> {
  try {
    const res = await fetch(`${EARN_BASE}/earn/portfolio/${wallet}/positions`, {
      headers,
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`Portfolio API error: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.positions || [];
  } catch {
    return getMockPositions();
  }
}

export async function getLifiQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
}) {
  const url = new URLSearchParams({
    fromChain: String(params.fromChain),
    toChain: String(params.toChain),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    integrator: "onetap-earn",
  });

  const res = await fetch(`${LIFI_BASE}/quote?${url}`, { headers });
  if (!res.ok) throw new Error(`Quote API error: ${res.status}`);
  return res.json();
}

function normalizeVault(v: Record<string, unknown>): Vault {
  return {
    id: (v.id as string) || (v.address as string) || Math.random().toString(),
    address: (v.address as string) || "",
    name: (v.name as string) || (v.protocol as string) || "Unknown Vault",
    protocol: (v.protocol as string) || (v.protocolName as string) || "Unknown",
    chain: (v.chain as string) || (v.chainName as string) || "Unknown",
    chainId: Number(v.chainId) || 1,
    asset: {
      symbol: ((v.asset as Record<string, unknown>)?.symbol as string) || (v.symbol as string) || "USDC",
      address: ((v.asset as Record<string, unknown>)?.address as string) || "",
      decimals: Number((v.asset as Record<string, unknown>)?.decimals) || 6,
      logoURI: (v.asset as Record<string, unknown>)?.logoURI as string | undefined,
    },
    apy: Number(v.apy) * (Number(v.apy) > 1 ? 1 : 100) || 0,
    apyBase: v.apyBase ? Number(v.apyBase) * 100 : undefined,
    apyReward: v.apyReward ? Number(v.apyReward) * 100 : undefined,
    tvl: Number(v.tvl) || 0,
    tvlUSD: Number(v.tvlUSD) || Number(v.tvl) || 0,
    category: (v.category as string) || "Lending",
    subcategory: (v.subcategory as string) || undefined,
    description: (v.description as string) || undefined,
    risk: getRiskLevel(Number(v.tvlUSD) || Number(v.tvl) || 0, Number(v.apy) || 0),
    logoURI: (v.logoURI as string) || (v.protocolLogoURI as string) || undefined,
  };
}

function getRiskLevel(tvl: number, apy: number): string {
  if (tvl > 100_000_000 && apy < 15) return "Low";
  if (tvl > 10_000_000 && apy < 30) return "Medium";
  return "High";
}

// Mock data fallback
export function getMockVaults(): Vault[] {
  return [
    {
      id: "1", address: "0xabc1", name: "USDC Savings Vault", protocol: "Aave V3",
      chain: "Arbitrum", chainId: 42161,
      asset: { symbol: "USDC", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
      apy: 8.4, apyBase: 5.2, apyReward: 3.2, tvl: 450_000_000, tvlUSD: 450_000_000,
      category: "Lending", risk: "Low", description: "Supply USDC to earn lending interest + ARB rewards.",
    },
    {
      id: "2", address: "0xabc2", name: "USDT Yield Optimizer", protocol: "Compound V3",
      chain: "Ethereum", chainId: 1,
      asset: { symbol: "USDT", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
      apy: 6.1, apyBase: 6.1, tvl: 820_000_000, tvlUSD: 820_000_000,
      category: "Lending", risk: "Low", description: "Blue-chip lending vault on Ethereum mainnet.",
    },
    {
      id: "3", address: "0xabc3", name: "ETH Liquid Staking", protocol: "Lido",
      chain: "Ethereum", chainId: 1,
      asset: { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
      apy: 4.2, apyBase: 4.2, tvl: 15_000_000_000, tvlUSD: 15_000_000_000,
      category: "Staking", risk: "Low", description: "Liquid staking ETH. Receive stETH earning ETH staking rewards.",
    },
    {
      id: "4", address: "0xabc4", name: "USDC-USDT LP", protocol: "Uniswap V3",
      chain: "Polygon", chainId: 137,
      asset: { symbol: "USDC", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
      apy: 12.7, apyBase: 12.7, tvl: 65_000_000, tvlUSD: 65_000_000,
      category: "LP / DEX", risk: "Medium", description: "Concentrated liquidity position on Uniswap V3.",
    },
    {
      id: "5", address: "0xabc5", name: "DAI Yield Vault", protocol: "MakerDAO",
      chain: "Ethereum", chainId: 1,
      asset: { symbol: "DAI", address: "0x6b175474e89094c44da98b954eedeac495271d0f", decimals: 18 },
      apy: 5.0, apyBase: 5.0, tvl: 980_000_000, tvlUSD: 980_000_000,
      category: "Lending", risk: "Low", description: "DSR - MakerDAO's DAI Savings Rate.",
    },
    {
      id: "6", address: "0xabc6", name: "WBTC Leveraged Yield", protocol: "Pendle",
      chain: "Arbitrum", chainId: 42161,
      asset: { symbol: "WBTC", address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", decimals: 8 },
      apy: 18.3, apyBase: 8.3, apyReward: 10.0, tvl: 32_000_000, tvlUSD: 32_000_000,
      category: "Yield Trading", risk: "High", description: "Tokenized yield via Pendle for WBTC strategies.",
    },
    {
      id: "7", address: "0xabc7", name: "USDC Auto-Compounder", protocol: "Yearn",
      chain: "Ethereum", chainId: 1,
      asset: { symbol: "USDC", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
      apy: 9.8, apyBase: 9.8, tvl: 210_000_000, tvlUSD: 210_000_000,
      category: "Yield Aggregator", risk: "Medium", description: "Auto-compounding USDC across top lending protocols.",
    },
    {
      id: "8", address: "0xabc8", name: "OP Incentivized USDC", protocol: "Aave V3",
      chain: "Optimism", chainId: 10,
      asset: { symbol: "USDC", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
      apy: 11.2, apyBase: 6.2, apyReward: 5.0, tvl: 88_000_000, tvlUSD: 88_000_000,
      category: "Lending", risk: "Medium", description: "USDC lending with Optimism OP token rewards.",
    },
  ];
}

function getMockPositions(): PortfolioPosition[] {
  const vaults = getMockVaults();
  return [
    {
      id: "pos1", vault: vaults[0], shares: "1000000000",
      sharesUSD: 1000, deposited: 1000, currentValue: 1084,
      earnings: 84, earnedUSD: 84, apy: 8.4,
    },
    {
      id: "pos2", vault: vaults[2], shares: "500000000000000000",
      sharesUSD: 1800, deposited: 1700, currentValue: 1800,
      earnings: 100, earnedUSD: 100, apy: 4.2,
    },
    {
      id: "pos3", vault: vaults[6], shares: "2000000000",
      sharesUSD: 2200, deposited: 2000, currentValue: 2200,
      earnings: 200, earnedUSD: 200, apy: 9.8,
    },
  ];
}

export const CHAIN_LOGOS: Record<number, string> = {
  1: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  137: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  42161: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  10: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  8453: "https://assets.coingecko.com/coins/images/28448/small/cbeth.png",
  56: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  43114: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
};

export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
  56: "BNB Chain",
  43114: "Avalanche",
};
