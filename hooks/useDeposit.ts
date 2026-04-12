import { useState, useCallback } from "react";
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
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
      const fromAmount = parseUnits(amount, vault.asset.decimals).toString();
      // Use the asset address as fromToken if same chain, else native
      const fromToken = chainId === vault.chainId
        ? (vault.asset.address || "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
        : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

      const q = await getLifiQuote({
        fromChain: chainId,
        toChain: vault.chainId,
        fromToken,
        toToken: vault.asset.address || "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        fromAmount,
        fromAddress: address,
      });

      setQuote(q as QuoteData);
      setStatus("idle");
      return q as QuoteData;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get quote";
      setQuoteError(msg);
      setStatus("idle");
      return null;
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