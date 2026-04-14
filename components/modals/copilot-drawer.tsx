"use client";

import { useState, useRef, useEffect } from "react";
import { X, Bot, Send, Sparkles, User } from "lucide-react";
import { useAppStore } from "@/store";
import { formatAPY, formatCurrency, cn } from "@/lib/utils";

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ASKS = [
  "Explain this protocol",
  "What's the risk here?",
  "Compare with alternatives",
  "Should I deposit?",
];

export function CopilotDrawer() {
  const { copilotOpen, copilotVault, closeCopilot } = useAppStore();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copilotOpen && copilotVault && messages.length === 0) {
      // Auto-welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `I can help you understand 
          **${copilotVault.name}** by ${copilotVault.protocol}.\n\nThis vault currently offers **${formatAPY(copilotVault.apy)} APY** on ${copilotVault.asset.symbol} with ${formatCurrency(copilotVault.tvlUSD)} TVL.\n\nWhat would you like to know?`,
        },
      ]);
    }
    if (!copilotOpen) {
      setMessages([]);
      setInput("");
    }
  }, [copilotOpen, copilotVault]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading || !copilotVault) return;

    setInput("");
    const userMsg: CopilotMessage = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
          vaultContext: copilotVault,
        }),
      });
      const data = await res.json();
      // Strip VAULTS_JSON from copilot responses (they're contextual)
      // Replace . with [\s\S] and remove the /s flag
      const cleanContent = (data.content || "I couldn't process that.")
        .replace(/VAULTS_JSON:\[[\s\S]*?\]/, "")
        .trim();
      setMessages((prev) => [...prev, { id: Date.now().toString() + "a", role: "assistant", content: cleanContent }]);
    } catch {
      setMessages((prev) => [...prev, { id: "err", role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!copilotOpen || !copilotVault) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 lg:bg-transparent" onClick={closeCopilot} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full z-50 w-full sm:w-[420px] flex flex-col glass border-l border-white/[0.08] animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Sparkles size={15} className="text-purple-400" />
            </div>
            <div>
              <div className="font-bold text-sm">AI Copilot</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{copilotVault.name}</div>
            </div>
          </div>
          <button onClick={closeCopilot} className="p-1.5 rounded-xl hover:bg-white/5 text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Vault context card */}
        <div className="m-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          <div className="flex items-center justify-between text-xs">
            <div className="text-muted-foreground">{copilotVault.protocol} · {copilotVault.chain}</div>
            <div className="text-brand-green font-bold">{formatAPY(copilotVault.apy)} APY</div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">TVL: {formatCurrency(copilotVault.tvlUSD)} · {copilotVault.risk} Risk</div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5",
                msg.role === "user" ? "bg-brand-green/20" : "bg-purple-500/20")}>
                {msg.role === "user"
                  ? <User size={12} className="text-brand-green" />
                  : <Bot size={12} className="text-purple-400" />
                }
              </div>
              <div className={cn("max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed",
                msg.role === "user"
                  ? "bg-brand-green text-brand-navy font-medium rounded-tr-sm"
                  : "glass-card border border-white/[0.06] rounded-tl-sm")}>
                {msg.content.split("\n").map((line, i) => {
                  const parts = line.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={i} className={i > 0 ? "mt-1" : ""}>
                      {parts.map((part, j) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={j}>{part.slice(2, -2)}</strong>
                          : <span key={j}>{part}</span>
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Bot size={12} className="text-purple-400" />
              </div>
              <div className="glass-card border border-white/[0.06] rounded-xl rounded-tl-sm px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick asks */}
        <div className="px-3 py-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_ASKS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-muted-foreground hover:text-foreground hover:border-brand-green/20 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex gap-2 glass-card rounded-xl border border-white/[0.08] px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Ask about this vault..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                input.trim() && !loading
                  ? "bg-brand-green text-brand-navy"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed")}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
