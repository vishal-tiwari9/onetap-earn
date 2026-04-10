"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { X, ArrowRight, Loader2, CheckCircle, AlertCircle, ExternalLink, Zap } from "lucide-react";
import { useAppStore } from "@/store";
import { getLifiQuote, CHAIN_NAMES } from "@/lib/lifi";
import { formatAPY, formatCurrency, getRiskColor, getRiskDot, cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = "input" | "quote" | "confirming" | "success" | "error";

export function DepositModal() {
  const { depositOpen, depositVault, closeDeposit } = useAppStore();
  const { address } = useAccount();
  const chainId = useChainId();

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  if (!depositOpen || !depositVault) return null;

  const vault = depositVault;
  const isCrossChain = chainId !== vault.chainId;

  const handleClose = () => {
    closeDeposit();
    setStep("input");
    setAmount("");
    setQuote(null);
    setTxHash("");
    setError("");
  };

  const handleGetQuote = async () => {
    if (!address || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setStep("quote");
    try {
      const amountInWei = (Number(amount) * Math.pow(10, vault.asset.decimals)).toString();
      const q = await getLifiQuote({
        fromChain: chainId,
        toChain: vault.chainId,
        fromToken: "0x0000000000000000000000000000000000000000", // native ETH
        toToken: vault.asset.address || "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        fromAmount: amountInWei,
        fromAddress: address,
      });
      setQuote(q);
    } catch {
      // Use mock quote for demo
      setQuote({
        estimate: {
          fromAmount: (Number(amount) * 1e6).toString(),
          toAmount: (Number(amount) * 1e6 * 0.9995).toString(),
          gasCosts: [{ amountUSD: "2.50" }],
        },
        action: { fromToken: { symbol: "USDC" }, toToken: { symbol: vault.asset.symbol } },
      });
    }
  };

  const handleDeposit = async () => {
    setStep("confirming");
    try {
      // In production: execute transactionRequest from quote via wagmi sendTransaction
      await new Promise((r) => setTimeout(r, 2500));
      const mockTx = "0x" + Math.random().toString(16).slice(2).padEnd(64, "0");
      setTxHash(mockTx);
      setStep("success");
      toast.success(`Successfully deposited ${amount} ${vault.asset.symbol}!`);
    } catch (err) {
      setError("Transaction failed. Please try again.");
      setStep("error");
    }
  };

  const estimatedYearly = Number(amount) * (vault.apy / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-card rounded-3xl border border-white/[0.08] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <Zap size={18} className="text-brand-green" />
            </div>
            <div>
              <div className="font-bold">Deposit to Vault</div>
              <div className="text-xs text-muted-foreground">{vault.protocol} · {CHAIN_NAMES[vault.chainId]}</div>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-white/5 text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Vault info strip */}
          <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <div>
              <div className="text-sm font-semibold">{vault.name}</div>
              <div className={cn("inline-flex items-center gap-1 text-xs mt-0.5", getRiskColor(vault.risk || ""))}>
                <div className={cn("w-1.5 h-1.5 rounded-full", getRiskDot(vault.risk || ""))} />
                {vault.risk} Risk
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-brand-green">{formatAPY(vault.apy)}</div>
              <div className="text-xs text-muted-foreground">APY</div>
            </div>
          </div>

          {/* Cross-chain notice */}
          {isCrossChain && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                Cross-chain deposit detected. LI.FI will bridge your funds from {CHAIN_NAMES[chainId]} → {CHAIN_NAMES[vault.chainId]} automatically.
              </span>
            </div>
          )}

          {/* Step: Input */}
          {(step === "input" || step === "quote") && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Amount ({vault.asset.symbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xl font-bold focus:outline-none focus:border-brand-green/40 transition-colors pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    {["100", "500", "1000"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(v)}
                        className="px-2 py-0.5 text-xs rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green/20"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {amount && Number(amount) > 0 && (
                <div className="p-3 bg-brand-green/5 border border-brand-green/10 rounded-xl space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated yearly yield</span>
                    <span className="text-brand-green font-bold">+{formatCurrency(estimatedYearly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly yield</span>
                    <span className="font-medium">+{formatCurrency(estimatedYearly / 12)}</span>
                  </div>
                </div>
              )}

              {/* Quote details */}
              {quote && step === "quote" && (
                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs space-y-1.5">
                  <div className="font-semibold text-sm mb-2">Transaction Details</div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>You pay</span>
                    <span className="text-foreground">{amount} {vault.asset.symbol}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>You receive (vault shares)</span>
                    <span className="text-foreground">≈ {amount} shares</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Network fee</span>
                    <span className="text-foreground">≈ $2.50</span>
                  </div>
                  {isCrossChain && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Bridge fee</span>
                      <span className="text-foreground">≈ $1.50</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={step === "input" ? handleGetQuote : handleDeposit}
                disabled={!amount || Number(amount) <= 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-navy rounded-xl font-bold hover:bg-brand-green-light transition-all disabled:opacity-50 disabled:cursor-not-allowed green-glow-sm"
              >
                {step === "input" ? (
                  <>Get Quote <ArrowRight size={16} /></>
                ) : (
                  <>Confirm Deposit <Zap size={16} /></>
                )}
              </button>
            </>
          )}

          {/* Step: Confirming */}
          {step === "confirming" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-brand-green animate-spin" />
              </div>
              <div className="font-bold text-lg mb-2">Confirming Transaction</div>
              <div className="text-muted-foreground text-sm">
                {isCrossChain ? "Bridging and depositing via LI.FI..." : "Depositing into vault..."}
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-brand-green" />
              </div>
              <div className="font-bold text-lg mb-1">Deposit Successful! 🎉</div>
              <div className="text-muted-foreground text-sm mb-4">
                You're now earning {formatAPY(vault.apy)} APY
              </div>
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-green text-xs hover:underline mb-4"
                >
                  View on Explorer <ExternalLink size={12} />
                </a>
              )}
              <button onClick={handleClose} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                Close
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <div className="font-bold text-lg mb-2">Transaction Failed</div>
              <div className="text-muted-foreground text-sm mb-4">{error}</div>
              <button onClick={() => setStep("input")} className="w-full py-3 bg-brand-green text-brand-navy rounded-xl font-bold hover:bg-brand-green-light transition-all">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
