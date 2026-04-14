"use client";

import { useState, useEffect } from "react";
import { useChainId } from "wagmi";
import {
  X, ArrowRight, Loader2, CheckCircle, AlertCircle,
  ExternalLink, Zap, RefreshCw, ArrowLeftRight,
} from "lucide-react";
import { useAppStore } from "@/store";
import { CHAIN_NAMES } from "@/lib/lifi";
import { formatAPY, formatCurrency, getRiskColor, getRiskDot, cn } from "@/lib/utils";
import { useDeposit } from "@/hooks/useDeposit";
import { toast } from "sonner";

// Chain → block explorer base URL
const EXPLORERS: Record<number, string> = {
  1: "https://etherscan.io",
  137: "https://polygonscan.com",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
  8453: "https://basescan.org",
  56: "https://bscscan.com",
  43114: "https://snowtrace.io",
  100: "https://gnosisscan.io",
  59144: "https://lineascan.build",
  534352: "https://scrollscan.com",
  324: "https://explorer.zksync.io",
  5000: "https://explorer.mantle.xyz",
};

function explorerTxUrl(chainId: number, hash: string): string {
  const base = EXPLORERS[chainId] ?? "https://etherscan.io";
  return `${base}/tx/${hash}`;
}

function StatusStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs",
      done ? "text-brand-green" : active ? "text-foreground" : "text-muted-foreground")}>
      <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0",
        done ? "bg-brand-green border-brand-green" : active ? "border-brand-green" : "border-white/20")}>
        {done ? <CheckCircle size={10} className="text-brand-navy" /> : active ? <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" /> : null}
      </div>
      {label}
    </div>
  );
}

export function DepositModal() {
  const { depositOpen, depositVault, closeDeposit } = useAppStore();
  const chainId = useChainId();
  const vault = depositVault;

  const [amount, setAmount] = useState("");
  const [quoteFetched, setQuoteFetched] = useState(false);

  const {
    status, quote, txHash, error, quoteError,
    isConfirming, isConfirmed, getQuote, execute, reset,
  } = useDeposit(vault);

  // Auto-advance to success when tx confirmed on-chain
  useEffect(() => {
    if (status === "success" && txHash) {
      toast.success(`🎉 Deposit confirmed! Earning ${vault?.apy.toFixed(2)}% APY`, { duration: 8000 });
    }
  }, [status, txHash, vault]);

  if (!depositOpen || !vault) return null;

  const isCrossChain = chainId !== vault.chainId;
  const fromChainName = CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
  const toChainName = CHAIN_NAMES[vault.chainId] ?? `Chain ${vault.chainId}`;
  const estimatedYearly = Number(amount) * (vault.apy / 100);
  const estimatedMonthly = estimatedYearly / 12;

  const isLoading = ["switching-chain", "quoting", "awaiting-signature", "pending-tx"].includes(status);

  // Gas cost from quote
  const gasCostUSD = quote?.estimate?.gasCosts?.[0]?.amountUSD
    ?? quote?.estimate?.feeCosts?.[0]?.amountUSD ?? null;

  const handleClose = () => {
    if (isLoading) return; // Don't allow close while tx is in flight
    closeDeposit();
    reset();
    setAmount("");
    setQuoteFetched(false);
  };

  const handleGetQuote = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const q = await getQuote(amount);
    if (q) setQuoteFetched(true);
  };

  const handleDeposit = () => execute();

  // ── Step: Success ─────────────────────────────────────────────────
  if (status === "success" && txHash) {
    return (
      <ModalShell onClose={handleClose} closable>
        <div className="text-center py-8 px-5">
          <div className="w-20 h-20 rounded-full bg-brand-green/10 border-2 border-brand-green/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={36} className="text-brand-green" />
          </div>
          <div className="text-xl font-black mb-1">Deposit Confirmed! 🎉</div>
          <div className="text-muted-foreground text-sm mb-1">
            You deposited <span className="text-foreground font-bold">{amount} {vault.asset.symbol}</span>
          </div>
          <div className="text-muted-foreground text-sm mb-5">
            Earning <span className="text-brand-green font-bold">{formatAPY(vault.apy)}</span> APY
          </div>

          <div className="p-3 bg-brand-green/5 border border-brand-green/10 rounded-xl text-sm mb-5 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly yield</span>
              <span className="text-brand-green font-bold">+{formatCurrency(estimatedMonthly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yearly yield</span>
              <span className="text-brand-green font-bold">+{formatCurrency(estimatedYearly)}</span>
            </div>
          </div>

          <a
            href={explorerTxUrl(vault.chainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-green text-sm font-medium hover:underline mb-5"
          >
            View transaction on {toChainName} Explorer
            <ExternalLink size={13} />
          </a>

          <button onClick={handleClose}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 font-semibold hover:bg-white/10 transition-colors text-sm">
            Close
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Step: Error ───────────────────────────────────────────────────
  if (status === "error") {
    return (
      <ModalShell onClose={handleClose} closable>
        <div className="text-center py-8 px-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <div className="font-bold text-lg mb-2">Transaction Failed</div>
          <div className="text-muted-foreground text-sm mb-5 px-4">{error}</div>
          <button
            onClick={() => { reset(); setQuoteFetched(false); }}
            className="w-full py-3 rounded-xl bg-brand-green text-brand-navy font-bold hover:bg-brand-green-light transition-all">
            Try Again
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Step: In-progress (switching / awaiting sig / mining) ─────────
  if (["switching-chain", "awaiting-signature", "pending-tx"].includes(status)) {
    const steps = [
      { label: "Switch network", active: status === "switching-chain", done: status !== "switching-chain" && isCrossChain },
      { label: "Approve in wallet", active: status === "awaiting-signature", done: ["pending-tx", "success"].includes(status) },
      { label: "Transaction mining", active: status === "pending-tx", done: isConfirmed },
    ].filter((s) => isCrossChain || s.label !== "Switch network");

    return (
      <ModalShell onClose={handleClose} closable={false}>
        <div className="text-center py-8 px-5">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mx-auto mb-5">
            <Loader2 size={28} className="text-brand-green animate-spin" />
          </div>
          <div className="font-bold text-lg mb-1">
            {status === "switching-chain" && "Switching Network…"}
            {status === "awaiting-signature" && "Waiting for Signature…"}
            {status === "pending-tx" && "Transaction Mining…"}
          </div>
          <div className="text-muted-foreground text-sm mb-6">
            {status === "awaiting-signature" && "Please check your wallet and approve the transaction"}
            {status === "pending-tx" && `Submitted on ${toChainName} · Awaiting confirmation`}
            {status === "switching-chain" && `Switching to ${toChainName}`}
          </div>

          {txHash && (
            <a href={explorerTxUrl(vault.chainId, txHash)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-green text-xs hover:underline mb-5">
              View on Explorer <ExternalLink size={11} />
            </a>
          )}

          <div className="space-y-2 text-left bg-white/[0.03] rounded-xl p-4">
            {steps.map((s) => <StatusStep key={s.label} {...s} />)}
          </div>
        </div>
      </ModalShell>
    );
  }

  // ── Main: Input + Quote ───────────────────────────────────────────
  return (
    <ModalShell onClose={handleClose} closable>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <Zap size={18} className="text-brand-green" />
          </div>
          <div>
            <div className="font-bold">Deposit</div>
            <div className="text-xs text-muted-foreground">{vault.protocol} · {toChainName}</div>
          </div>
        </div>
        <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-white/5 text-muted-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Vault strip */}
        <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div>
            <div className="text-sm font-semibold">{vault.name}</div>
            <span className={cn("inline-flex items-center gap-1 text-xs mt-0.5", getRiskColor(vault.risk))}>
              <span className={cn("w-1.5 h-1.5 rounded-full", getRiskDot(vault.risk))} />
              {vault.risk} Risk
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-brand-green">{formatAPY(vault.apy)}</div>
            <div className="text-xs text-muted-foreground">APY</div>
          </div>
        </div>

        {/* Cross-chain notice */}
        {isCrossChain && (
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            <ArrowLeftRight size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              Cross-chain: funds will bridge from <strong>{fromChainName}</strong> → <strong>{toChainName}</strong> via LI.FI automatically.
            </span>
          </div>
        )}

        {/* Amount input */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block font-medium">
            Amount · {vault.asset.symbol}
            {isCrossChain && (
              <span className="ml-1 text-blue-400">
                (paying with {vault.asset.symbol} on {fromChainName})
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setQuoteFetched(false); }}
              placeholder="0.00"
              min="0"
              disabled={status === "quoting"}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xl font-bold focus:outline-none focus:border-brand-green/40 transition-colors pr-28 disabled:opacity-60"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {["100", "500", "1000"].map((v) => (
                <button key={v} onClick={() => { setAmount(v); setQuoteFetched(false); }}
                  className="px-2 py-0.5 text-xs rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green/20">
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Yield preview */}
        {Number(amount) > 0 && (
          <div className="p-3 bg-brand-green/5 border border-brand-green/10 rounded-xl space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yearly yield</span>
              <span className="text-brand-green font-bold">+{formatCurrency(estimatedYearly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly yield</span>
              <span className="font-medium">+{formatCurrency(estimatedMonthly)}</span>
            </div>
          </div>
        )}

        {/* Quote error */}
        {quoteError && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-300">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{quoteError}. You can still try depositing directly.</span>
          </div>
        )}

        {/* Quote details */}
        {quoteFetched && quote && (
          <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs space-y-2">
            <div className="font-semibold text-sm flex items-center justify-between">
              Quote Details
              <button onClick={handleGetQuote} className="text-muted-foreground hover:text-brand-green transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>You pay</span>
              <span className="text-foreground font-medium">{amount} {vault.asset.symbol}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Route</span>
              <span className="text-foreground font-medium">
                {quote.toolDetails?.name ?? quote.tool ?? (isCrossChain ? "LI.FI Bridge" : "Direct")}
              </span>
            </div>
            {gasCostUSD && (
              <div className="flex justify-between text-muted-foreground">
                <span>Est. gas fee</span>
                <span className="text-foreground font-medium">${Number(gasCostUSD).toFixed(2)}</span>
              </div>
            )}
            {isCrossChain && (
              <div className="flex justify-between text-muted-foreground">
                <span>From → To chain</span>
                <span className="text-foreground font-medium">{fromChainName} → {toChainName}</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!quoteFetched ? (
          <button
            onClick={handleGetQuote}
            disabled={!amount || Number(amount) <= 0 || status === "quoting"}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-navy rounded-xl font-bold hover:bg-brand-green-light transition-all disabled:opacity-50 disabled:cursor-not-allowed green-glow-sm">
            {status === "quoting" ? (
              <><Loader2 size={16} className="animate-spin" /> Getting Quote…</>
            ) : (
              <>Get Quote <ArrowRight size={16} /></>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleDeposit}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-navy rounded-xl font-bold hover:bg-brand-green-light transition-all disabled:opacity-50 green-glow-sm">
              <Zap size={16} />
              {isCrossChain ? "Bridge & Deposit" : "Deposit Now"}
            </button>
            <button
              onClick={() => { setQuoteFetched(false); }}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Change amount
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Transaction will open your wallet for approval · Powered by LI.FI
        </p>
      </div>
    </ModalShell>
  );
}

// Shared modal shell
function ModalShell({ children, onClose, closable }: {
  children: React.ReactNode;
  onClose: () => void;
  closable: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />
      <div className="relative w-full max-w-md glass-card rounded-3xl border border-white/[0.08] overflow-hidden animate-slide-up">
        {children}
      </div>
    </div>
  );
}