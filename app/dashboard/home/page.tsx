"use client";

import { useAccount, useBalance } from "wagmi";
import { useRouter } from "next/navigation";
import { TrendingUp, Wallet, ArrowRight, Zap, Bot, ChevronRight, Activity } from "lucide-react";
import { formatCurrency, formatAddress } from "@/lib/utils";
import { getMockVaults } from "@/lib/lifi";
import { VaultCard } from "@/components/cards/vault-card";
import { useAppStore } from "@/store";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const mockEarningsHistory = Array.from({ length: 14 }, (_, i) => ({
  day: i + 1,
  value: 100 + i * 12 + Math.random() * 20,
}));

export default function DashboardHome() {
  const { address, chain } = useAccount();
  const router = useRouter();
  const { openDeposit } = useAppStore();

  const topVaults = getMockVaults().slice(0, 3);

  const quickStats = [
    { label: "Portfolio Value", value: "$5,084", change: "+$284", positive: true, icon: <Wallet size={18} /> },
    { label: "Total Earned", value: "$384", change: "+$42 this week", positive: true, icon: <TrendingUp size={18} /> },
    { label: "Avg APY", value: "7.8%", change: "Across 3 positions", positive: true, icon: <Activity size={18} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, <span className="gradient-text">{address ? formatAddress(address) : "anon"}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">Your money is working hard. Here's how it's doing.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/get-yield")}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-green text-brand-navy rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-all green-glow-sm"
        >
          <Zap size={16} />
          Earn Now
        </button>
      </div>

      {/* Big earn CTA (mobile) */}
      <button
        onClick={() => router.push("/dashboard/get-yield")}
        className="sm:hidden w-full flex items-center justify-between p-4 bg-brand-green/10 border border-brand-green/20 rounded-2xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/20 flex items-center justify-center">
            <Zap size={20} className="text-brand-green" />
          </div>
          <div className="text-left">
            <div className="font-bold text-brand-green">Start Earning</div>
            <div className="text-xs text-muted-foreground">Find the best yield for you</div>
          </div>
        </div>
        <ArrowRight size={18} className="text-brand-green group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-muted-foreground text-sm">{stat.label}</div>
              <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className={`text-xs mt-1 ${stat.positive ? "text-brand-green" : "text-red-400"}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Earnings chart + AI CTA */}
      <div className="grid sm:grid-cols-5 gap-4">
        {/* Mini chart */}
        <div className="sm:col-span-3 glass-card rounded-2xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Earnings Growth</div>
              <div className="text-xs text-muted-foreground">Last 14 days</div>
            </div>
            <div className="text-right">
              <div className="text-brand-green font-bold">+$42</div>
              <div className="text-xs text-muted-foreground">this week</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={mockEarningsHistory}>
              <Line type="monotone" dataKey="value" stroke="#00D4AA" strokeWidth={2} dot={false} />
              <Tooltip
                contentStyle={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                formatter={(v: number) => [`$${v.toFixed(0)}`, "Value"]}
                labelFormatter={() => ""}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI CTA */}
        <div
          onClick={() => router.push("/dashboard/ask-ai")}
          className="sm:col-span-2 glass-card rounded-2xl p-5 border border-white/[0.06] cursor-pointer group hover:border-purple-500/20 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Bot size={24} className="text-purple-400" />
          </div>
          <div className="font-semibold mb-1">Ask AI Advisor</div>
          <div className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Get personalized yield recommendations in plain English.
          </div>
          <div className="flex items-center gap-1 text-purple-400 text-sm font-medium">
            Chat Now <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Top Vaults */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Top Vaults</h2>
          <button
            onClick={() => router.push("/dashboard/get-yield")}
            className="text-brand-green text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            See all <ArrowRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {topVaults.map((vault) => (
            <VaultCard key={vault.id} vault={vault} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
