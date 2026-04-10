import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
} from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "OneTap Earn",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche],
  ssr: true,
});

export const SUPPORTED_CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷" },
  { id: 137, name: "Polygon", logo: "🟣" },
  { id: 42161, name: "Arbitrum", logo: "🔵" },
  { id: 10, name: "Optimism", logo: "🔴" },
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 56, name: "BSC", logo: "🟡" },
  { id: 43114, name: "Avalanche", logo: "🔺" },
];
