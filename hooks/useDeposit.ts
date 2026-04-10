import { useState } from "react";
import { useAccount, useChainId, useSendTransaction } from "wagmi";
import { getLifiQuote, type Vault } from "@/lib/lifi";
import { toast } from "sonner";

type DepositStatus = "idle" | "quoting" | "ready" | "pending" | "success" | "error";

export function useDeposit(vault: Vault | null) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();

  const [status, setStatus] = useState<DepositStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getQuote = async (amount: string) => {
    if (!vault || !address) return;
    setStatus("quoting");
    setError(null);

    try {
      const amountInWei = (Number(amount) * Math.pow(10, vault.asset.decimals)).toString();
      const q = await getLifiQuote({
        fromChain: chainId,
        toChain: vault.chainId,
        fromToken: "0x0000000000000000000000000000000000000000",
        toToken: vault.asset.address,
        fromAmount: amountInWei,
        fromAddress: address,
      });
      setQuote(q);
      setStatus("ready");
      return q;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get quote";
      setError(msg);
      setStatus("error");
    }
  };

  const execute = async () => {
    if (!quote || !vault) return;
    setStatus("pending");

    try {
      const txRequest = (quote as Record<string, Record<string, unknown>>).transactionRequest;
      if (txRequest) {
        const hash = await sendTransactionAsync({
          to: txRequest.to as `0x${string}`,
          data: txRequest.data as `0x${string}`,
          value: BigInt(txRequest.value as string || "0"),
        });
        setTxHash(hash);
      } else {
        // Simulate for demo
        await new Promise((r) => setTimeout(r, 2000));
        setTxHash("0x" + Math.random().toString(16).slice(2).padEnd(64, "0"));
      }

      setStatus("success");
      toast.success(`✅ Deposited into ${vault.name}! Earning ${vault.apy.toFixed(2)}% APY`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  const reset = () => {
    setStatus("idle");
    setQuote(null);
    setTxHash(null);
    setError(null);
  };

  return { status, quote, txHash, error, getQuote, execute, reset };
}
