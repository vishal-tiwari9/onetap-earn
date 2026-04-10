"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Trash2, Sparkles, User } from "lucide-react";
import { useAppStore, type ChatMessage } from "@/store";
import { VaultCard } from "@/components/cards/vault-card";
import type { Vault } from "@/lib/lifi";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "Safest 8%+ USDC yield on Arbitrum?",
  "Compare Aave vs Compound for USDC",
  "Explain how liquid staking works",
  "Best yield for 500 USDC — low risk only",
  "What's the risk in Pendle vaults?",
  "Mere liye best USDT yield kya hai?",
];

function parseVaultsFromMessage(content: string): { text: string; vaults: Vault[] } {
  const match = content.match(/VAULTS_JSON:(\[.*?\])/s);
  if (!match) return { text: content, vaults: [] };
  try {
    const vaults = JSON.parse(match[1]) as Vault[];
    const text = content.replace(/VAULTS_JSON:\[.*?\]/s, "").trim();
    return { text, vaults };
  } catch {
    return { text: content, vaults: [] };
  }
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const { text, vaults } = parseVaultsFromMessage(message.content);

  return (
    <div className={cn("flex gap-3 animate-slide-up", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center",
          isUser ? "bg-brand-green/20" : "bg-purple-500/20"
        )}
      >
        {isUser ? (
          <User size={16} className="text-brand-green" />
        ) : (
          <Bot size={16} className="text-purple-400" />
        )}
      </div>

      <div className={cn("flex flex-col gap-3 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        {/* Text bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-brand-green text-brand-navy font-medium rounded-tr-sm"
              : "glass-card border border-white/[0.06] text-foreground rounded-tl-sm"
          )}
        >
          {text.split("\n").map((line, i) => {
            // Bold markdown
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className={i > 0 ? "mt-1" : ""}>
                {parts.map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j} className={isUser ? "text-brand-navy" : "text-foreground"}>
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </div>

        {/* Vault cards */}
        {vaults.length > 0 && (
          <div className="w-full space-y-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-green" />
              AI Recommended Vaults
            </div>
            {vaults.map((vault) => (
              <VaultCard key={vault.id} vault={vault} />
            ))}
          </div>
        )}

        <div className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-purple-400" />
      </div>
      <div className="glass-card border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AskAIPage() {
  const { messages, addMessage, clearMessages } = useAppStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    setInput("");
    addMessage({ role: "user", content });
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
        }),
      });

      const data = await res.json();
      addMessage({ role: "assistant", content: data.content || "Sorry, something went wrong. Please try again." });
    } catch {
      addMessage({ role: "assistant", content: "Network error. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] lg:h-[calc(100vh-3rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Bot size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg">AI Yield Advisor</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Online · Powered by Grok + LI.FI live data
            </div>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={clearMessages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
          >
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in">
            {/* Welcome */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Ask Me Anything</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                I analyze live DeFi vaults and give you personalized yield recommendations in plain English — or Hinglish!
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 rounded-xl glass-card border border-white/[0.06] text-sm text-muted-foreground hover:text-foreground hover:border-brand-green/20 transition-all group"
                >
                  <span className="text-brand-green group-hover:mr-1 transition-all">→</span>{" "}
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-4 glass-card rounded-2xl border border-white/[0.08] p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about yield, risk, protocols... (Enter to send)"
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32 leading-relaxed"
          style={{ height: "auto" }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 128) + "px";
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
            input.trim() && !loading
              ? "bg-brand-green text-brand-navy hover:bg-brand-green-light green-glow-sm"
              : "bg-white/5 text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send size={15} />
        </button>
      </div>
      <div className="text-center text-[10px] text-muted-foreground mt-2">
        AI responses use live LI.FI vault data · Not financial advice
      </div>
    </div>
  );
}
