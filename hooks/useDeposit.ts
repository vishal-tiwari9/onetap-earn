import { useState, useCallback } from "react";
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { parseUnits, type Hash } from "viem";
import { getLifiQuote, type Vault } from "@/lib/lifi";
import { toast } from "sonner";

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
    chainId?: number;
  };
  estimate?: {
    fromAmount: string;
    toAmount: string;
    gasCosts?: { amountUSD: string }[];
    feeCosts?: { amountUSD: string }[];
  };
}

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

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

      const q = await getLifiQuote({
        fromChain: chainId,               // User's current chain (Base)
        toChain: vault.chainId,           // Vault's chain
        fromToken: BASE_USDC,             // Force Base USDC
        toToken: vault.address,           // ← Most Important: Vault contract address
        fromAmount: amountInWei,
        fromAddress: address,
      });

      setQuote(q as QuoteData);
      setStatus("idle");
      return q as QuoteData;

    } catch (err: any) {
      console.error("Quote failed:", err);
      const msg = err?.message || "Failed to get quote";

      // Last fallback: native token
      try {
        const amountInWei = parseUnits(amount, 18).toString();

        const q = await getLifiQuote({
          fromChain: chainId,
          toChain: vault.chainId,
          fromToken: "0x0000000000000000000000000000000000000000",
          toToken: vault.address,
          fromAmount: amountInWei,
          fromAddress: address,
        });

        setQuote(q as QuoteData);
        setQuoteError("Used native token as fallback");
        setStatus("idle");
        return q as QuoteData;
      } catch (fallbackErr: any) {
        console.error("Fallback failed:", fallbackErr);
        setQuoteError(msg);
        setStatus("idle");
        return null;
      }
    }
  }, [vault, address, chainId]);

  const execute = useCallback(async () => {
    if (!vault || !address || !quote?.transactionRequest) {
      toast.error("No transaction data. Please get a quote first.");
      setStatus("error");
      return;
    }

    try {
      if (chainId !== vault.chainId) {
        setStatus("switching-chain");
        try {
          await switchChainAsync({ chainId: vault.chainId });
        } catch {}
      }

      const txReq = quote.transactionRequest;

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

    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("denied")) {
        setError("Transaction cancelled by user.");
        toast.error("Transaction cancelled.");
      } else {
        setError(msg);
        toast.error(`Failed: ${msg.slice(0, 80)}`);
      }
      setStatus("error");
    }
  }, [vault, address, chainId, quote, sendTransactionAsync, switchChainAsync]);

  const finalStatus: DepositStatus =
    status === "pending-tx" && isConfirmed ? "success" : status;

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