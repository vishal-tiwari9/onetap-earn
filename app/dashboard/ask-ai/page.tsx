"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Trash2, Sparkles, User, BarChart2, TrendingUp, Shield } from "lucide-react";
import { useAppStore, type ChatMessage } from "@/store";
import { VaultCard } from "@/components/cards/vault-card";
import type { Vault } from "@/lib/lifi";
import { cn, formatAPY, formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const SUGGESTED_PROMPTS = [
  "Safest 8%+ USDC yield on Arbitrum right now?",
  "Compare Aave vs Compound for stablecoins",
  "Best vault if I have 1000 USDC — low risk only",
  "Explain liquid staking vs lending yields",
  "Mere 500 USDC ke liye best option kya hai?",
  "Which chain has best yields right now?",
];

function parseVaultsFromMessage(content: string): { text: string; vaults: Vault[] } {
  const match = content.match(/VAULTS_JSON:(\[[\s\S]*?\])/);
  if (!match) return { text: content, vaults: [] };
  try {
    const vaults = JSON.parse(match[1]) as Vault[];
    const text = content.replace(/VAULTS_JSON:[\s\S]*$/, "").trim();
    return { text, vaults };
  } catch {
    return { text: content, vaults: [] };
  }
}

// Inline mini APY bar chart rendered inside a message
function InlineApyChart({ vaults }: { vaults: Vault[] }) {
  const data = vaults.map((v) => ({ name: v.protocol, APY: parseFloat(v.apy.toFixed(2)) }));
  return (
    <div className="mt-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <BarChart2 size={12} className="text-brand-green" />
        APY Comparison
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} barSize={20}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#8896B0" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={30} />
          <Tooltip
            contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 11 }}
            formatter={(v: number) => [`${v}%`, "APY"]}
          />
          <Bar dataKey="APY" fill="#00D4AA" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Risk radar chart
function RiskRadar({ vaults }: { vaults: Vault[] }) {
  const riskNum = (r?: string) => r === "Low" ? 90 : r === "Medium" ? 55 : 25;
  const data = [
    { metric: "Safety", ...Object.fromEntries(vaults.map((v) => [v.protocol, riskNum(v.risk)])) },
    { metric: "APY", ...Object.fromEntries(vaults.map((v) => [v.protocol, Math.min(v.apy * 5, 100)])) },
    { metric: "TVL", ...Object.fromEntries(vaults.map((v) => [v.protocol, Math.min(v.tvlUSD / 1e8, 100)])) },
  ];
  const COLORS = ["#00D4AA", "#0984E3", "#6C67F1", "#F4A261"];

  return (
    <div className="mt-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Shield size={12} className="text-blue-400" />
        Risk Profile Comparison
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#8896B0" }} />
          <PolarRadiusAxis tick={{ fontSize: 8, fill: "#8896B0" }} domain={[0, 100]} />
          {vaults.slice(0, 4).map((v, i) => (
            <Radar key={v.id} name={v.protocol} dataKey={v.protocol} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Render formatted message text with markdown-like styling
function MessageText({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Heading line (starts with emoji + bold)
        if (/^[🎯📈💰⚠️🔒🏆📊💡✅🟢🔴🟡🔵]/.test(line)) {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={i} className={`font-bold text-sm ${isUser ? "" : "text-brand-green"} mt-2 first:mt-0`}>
              {parts.map((p, j) =>
                p.startsWith("**") ? <span key={j}>{p.slice(2, -2)}</span> : <span key={j}>{p}</span>
              )}
            </div>
          );
        }

        // Bullet point
        if (line.startsWith("• ") || line.startsWith("- ")) {
          const content = line.slice(2);
          const parts = content.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={i} className="flex gap-2 text-xs leading-relaxed">
              <span className="text-brand-green mt-0.5 flex-shrink-0">•</span>
              <span>
                {parts.map((p, j) =>
                  p.startsWith("**") ? (
                    <strong key={j} className={isUser ? "text-brand-navy" : "text-white"}>{p.slice(2, -2)}</strong>
                  ) : <span key={j}>{p}</span>
                )}
              </span>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\./.test(line)) {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={i} className="flex gap-2 text-xs leading-relaxed">
              {parts.map((p, j) =>
                p.startsWith("**") ? (
                  <strong key={j} className={isUser ? "text-brand-navy" : "text-white"}>{p.slice(2, -2)}</strong>
                ) : <span key={j}>{p}</span>
              )}
            </div>
          );
        }

        // Regular line with bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-xs leading-relaxed">
            {parts.map((p, j) =>
              p.startsWith("**") ? (
                <strong key={j} className={isUser ? "text-brand-navy" : "text-white font-bold"}>{p.slice(2, -2)}</strong>
              ) : <span key={j}>{p}</span>
            )}
          </p>
        );
      })}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const { text, vaults } = parseVaultsFromMessage(message.content);
  const showApyChart = !isUser && vaults.length >= 2;
  const showRadar = !isUser && vaults.length >= 2;

  return (
    <div className={cn("flex gap-3 animate-slide-up", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5",
        isUser ? "bg-brand-green/20" : "bg-purple-500/20")}>
        {isUser ? <User size={15} className="text-brand-green" /> : <Bot size={15} className="text-purple-400" />}
      </div>

      <div className={cn("flex flex-col gap-3 max-w-[88%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 w-full",
          isUser
            ? "bg-brand-green text-brand-navy font-medium rounded-tr-sm"
            : "glass-card border border-white/[0.06] text-foreground rounded-tl-sm"
        )}>
          <MessageText text={text} isUser={isUser} />

          {/* Inline charts */}
          {showApyChart && <InlineApyChart vaults={vaults} />}
          {showRadar && vaults.length >= 3 && <RiskRadar vaults={vaults} />}
        </div>

        {/* Vault cards */}
        {vaults.length > 0 && (
          <div className="w-full space-y-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles size={11} className="text-brand-green" />
              {vaults.length} vault{vaults.length > 1 ? "s" : ""} found from live LI.FI data
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
        <Bot size={15} className="text-purple-400" />
      </div>
      <div className="glass-card border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">Checking live LI.FI data…</span>
      </div>
    </div>
  );
}

export default function AskAIPage() {
  const { messages, addMessage, clearMessages } = useAppStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
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
            ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
        }),
      });
      const data = await res.json();
      addMessage({
        role: "assistant",
        content: data.content || "Sorry, something went wrong. Please try again.",
      });
    } catch {
      addMessage({ role: "assistant", content: "Network error. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] lg:h-[calc(100vh-3rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Bot size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg">AI Yield Advisor</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              
            </div>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={clearMessages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all"
          >
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Ask Me Anything</h2>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                I fetch <strong className="text-foreground">live vault data</strong> from LI.FI and give you real APY numbers, risk analysis, and charts — no made-up figures.
              </p>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 rounded-xl glass-card border border-white/[0.06] text-sm text-muted-foreground hover:text-foreground hover:border-brand-green/20 transition-all group"
                >
                  <span className="text-brand-green group-hover:mr-1 transition-all">→</span>{" "}{prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex-shrink-0">
        <div className="glass-card rounded-2xl border border-white/[0.08] p-3 flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about yield, risk, protocols… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32 leading-relaxed"
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
          All data is live from LI.FI Earn API · Not financial advice
        </div>
      </div>
    </div>
  );
}
