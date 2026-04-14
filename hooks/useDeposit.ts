import { useState, useCallback } from "react";
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { parseUnits, type Hash } from "viem";
import { getLifiQuote, type Vault } from "@/lib/lifi";
import { toast } from "sonner";

// Well-known stablecoin + token addresses per chain
// Used to find the right fromToken when user is on a different chain than the vault
const TOKEN_ADDRESSES: Record<string, Record<number, string>> = {
  USDC: {
    1:     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
    137:   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
    42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // Arbitrum (USDC.e)
    10:    "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // Optimism
    8453:  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
    56:    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC
    43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Avalanche
  },
  USDT: {
    1:     "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    137:   "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    10:    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    56:    "0x55d398326f99059fF775485246999027B3197955",
    43114: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
  },
  DAI: {
    1:     "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    137:   "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    42161: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    10:    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
  ETH: {
    1:     "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    42161: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    10:    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    8453:  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  },
  WETH: {
    1:     "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    137:   "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    10:    "0x4200000000000000000000000000000000000006",
    8453:  "0x4200000000000000000000000000000000000006",
  },
};

const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Get the best fromToken address for a given asset symbol on the user's current chain
function getFromToken(assetSymbol: string, userChainId: number): string {
  const sym = assetSymbol.toUpperCase().replace(/\.E$/, ""); // normalize USDC.e → USDC
  const map = TOKEN_ADDRESSES[sym];
  if (map?.[userChainId]) return map[userChainId];
  // Fallback: native token (ETH/BNB/MATIC)
  return NATIVE;
}

// Get decimals for fromToken on user's chain
function getFromDecimals(assetSymbol: string): number {
  const sym = assetSymbol.toUpperCase().replace(/\.E$/, "");
  if (["ETH", "WETH", "MATIC", "BNB", "AVAX"].includes(sym)) return 18;
  return 6; // USDC, USDT default
}

export type DepositStatus =
  | "idle"
  | "switching-chain"
  | "quoting"
  | "awaiting-signature"
  | "pending-tx"
  | "success"
  | "error";

interface QuoteData {
  transactionRequest?: {
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
    gasPrice?: string;
    from?: string;
    chainId?: number;
  };
  estimate?: {
    fromAmount: string;
    toAmount: string;
    gasCosts?: { amountUSD: string }[];
    feeCosts?: { amountUSD: string }[];
  };
  action?: {
    fromToken?: { symbol: string };
    toToken?: { symbol: string };
  };
  tool?: string;
  toolDetails?: { name: string; logoURI?: string };
}

export function useDeposit(vault: Vault | null) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  const [status, setStatus] = useState<DepositStatus>("idle");
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Watch for on-chain confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  });

  const getQuote = useCallback(async (amount: string): Promise<QuoteData | null> => {
    if (!vault || !address || !amount || Number(amount) <= 0) return null;

    setStatus("quoting");
    setError(null);
    setQuoteError(null);
    setQuote(null);

    try {
      const decimals = vault.asset.decimals || 6;
      const amountInWei = parseUnits(amount, decimals).toString();

      // ─────────────────────────────────────────────────────────────
      //  BEST FIX: Force USDC on Base + Correct toToken = vault.address
      // ─────────────────────────────────────────────────────────────
      const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

      // Use USDC as fromToken (tere paas yeh hai)
      const fromToken = BASE_USDC;

      // Most Important: toToken should be the vault's contract address
      const toToken = vault.address;

      const q = await getLifiQuote({
        fromChain: chainId,
        toChain: vault.chainId,
        fromToken,
        toToken,                    // ← Yeh line sabse critical hai
        fromAmount: amountInWei,
        fromAddress: address,
      });

      setQuote(q as QuoteData);
      setStatus("idle");
      return q as QuoteData;

    } catch (err: any) {
      console.error("Primary quote failed:", err);
      const msg = err?.message || "Failed to get quote";

      // Fallback: Try with native token (ETH)
      try {
        const amountInWei = parseUnits(amount, 18).toString();

        const q = await getLifiQuote({
          fromChain: chainId,
          toChain: vault.chainId,
          fromToken: "0x0000000000000000000000000000000000000000",
          toToken: vault.address,           // ← Same fix yahan bhi
          fromAmount: amountInWei,
          fromAddress: address,
        });

        setQuote(q as QuoteData);
        setQuoteError("Used native ETH as fallback");
        setStatus("idle");
        return q as QuoteData;
      } catch (fallbackErr: any) {
        console.error("Fallback also failed:", fallbackErr);
        setQuoteError(msg);
        setStatus("idle");
        return null;
      }
    }
  }, [vault, address, chainId]);

  const execute = useCallback(async () => {
    if (!vault || !address) return;

    try {
      // Step 1: Switch chain if needed
      if (chainId !== vault.chainId) {
        setStatus("switching-chain");
        try {
          await switchChainAsync({ chainId: vault.chainId });
        } catch {
          // User rejected switch or chain not configured — try on current chain
        }
      }

      // Step 2: Need a quote with transactionRequest
      if (!quote?.transactionRequest) {
        toast.error("No transaction data. Please get a quote first.");
        setStatus("error");
        setError("No transaction request from LI.FI quote.");
        return;
      }

      const txReq = quote.transactionRequest;

      // Step 3: Prompt wallet to sign
      setStatus("awaiting-signature");
      toast.info("Check your wallet to approve the transaction…", { duration: 8000 });

      const hash = await sendTransactionAsync({
        to: txReq.to as `0x${string}`,
        data: txReq.data as `0x${string}`,
        value: txReq.value ? BigInt(txReq.value) : BigInt(0),
        ...(txReq.gasLimit ? { gas: BigInt(txReq.gasLimit) } : {}),
      });

      setTxHash(hash);
      setStatus("pending-tx");
      toast.success("Transaction submitted! Waiting for confirmation…", { duration: 5000 });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      // User rejected
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("denied")) {
        setError("Transaction cancelled by user.");
        toast.error("Transaction cancelled.");
      } else {
        setError(msg);
        toast.error(`Transaction failed: ${msg.slice(0, 80)}`);
      }
      setStatus("error");
    }
  }, [vault, address, chainId, quote, sendTransactionAsync, switchChainAsync]);

  // When on-chain confirmation comes in
  const finalStatus: DepositStatus = (() => {
    if (status === "pending-tx" && isConfirmed) return "success";
    return status;
  })();

  const reset = useCallback(() => {
    setStatus("idle");
    setQuote(null);
    setTxHash(null);
    setError(null);
    setQuoteError(null);
  }, []);

  return {
    status: finalStatus,
    quote,
    txHash,
    error,
    quoteError,
    isConfirming,
    isConfirmed,
    getQuote,
    execute,
    reset,
  };
}
