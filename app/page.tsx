"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { TrendingUp, Shield, Zap, Globe, ArrowRight, Star } from "lucide-react";
import FamewallEmbed from "@/components/FamewallEmbed";

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push("/dashboard/home");
  }, [isConnected, router]);

  return (
    <main className="min-h-screen bg-brand-navy relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-green/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-brand-green/3 blur-[160px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,212,170,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center">
            <TrendingUp size={16} className="text-brand-navy" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            OneTap <span className="gradient-text">Earn</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://li.fi" target="_blank" rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Powered by LI.FI
          </a>
          <ConnectButton />
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-sm font-medium mb-8">
          <Star size={12} fill="currentColor" />
          LI.FI DeFi Mullet Hackathon 2026
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6">
          Your Money,{" "}
          <span className="gradient-text">Working Hard</span>
          <br />
          While You Sleep
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          The simplest DeFi yield aggregator. No jargon. No complexity. Just connect your wallet and let your idle assets earn — automatically, across any chain.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="group flex items-center gap-3 px-8 py-4 bg-brand-green text-brand-navy font-bold text-lg rounded-2xl hover:bg-brand-green-light transition-all duration-200 green-glow hover:scale-105 active:scale-95"
              >
                Start Earning Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </ConnectButton.Custom>
          <button className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-foreground hover:bg-white/5 transition-all font-medium">
            View Vaults
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: "Total TVL", value: "$2.4B+" },
            { label: "Avg APY", value: "8.7%" },
            { label: "Protocols", value: "50+" },
            { label: "Chains", value: "7" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-4">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="text-brand-green" size={24} />,
              title: "One-Tap Deposits",
              desc: "Deposit from any chain, any token. LI.FI handles all cross-chain routing automatically.",
            },
            {
              icon: <Shield className="text-blue-400" size={24} />,
              title: "Risk-Graded Vaults",
              desc: "Every vault has a clear risk label. Stick to Low risk or go for higher yields — your choice.",
            },
            {
              icon: <Globe className="text-purple-400" size={24} />,
              title: "AI-Powered Advisor",
              desc: "Ask in plain English. Our AI finds the best yield for your goals, budget, and risk tolerance.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 group hover:border-brand-green/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* What People Are Saying */}
  {/* What People Are Saying - Real X Style */}
{/* What People Are Saying - Exact X Style */}
<section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
  <div className="text-center mb-12">
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm mb-4">
      <span className="text-[#1DA1F2]">𝕏</span> Real Feedback from the Community
    </div>
    <h2 className="text-4xl font-bold tracking-tight mb-3">What People Are Saying</h2>
    <p className="text-muted-foreground">Honest reactions from DeFi Mullet Hackathon builders</p>
  </div>

  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[
      {
        username: "tiwaridevesh",
        handle: "@tiwaridevesh",
        avatar: "/assets/tweets/devesh.png",
        text: "@VishalT12094272 @lifiprotocol Crazy Idea bro ...i was literally waiting for such product ...let me know ..once its is live to use",
        time: "10h ago",
        likes: "4",
        link: "https://x.com/tiwaridevesh/status/2043581020528840966"
      },
      {
        username: "SahilYadav199",
        handle: "@SahilYadav199",
        avatar: "tweets/yadav-sahil.png",
        text: "Damn this is actually a solid idea, nicely built!Comparing protocols in one place + AI guidance is actually super useful.",
        time: "2h ago",
        likes: "47",
        link: "https://x.com/SahilYadav199/status/2043710350345003372"
      },
      {
        username: "UTDSahil_",
        handle: "@UTDSahil_",
        avatar: "/public/tweets/utd_sahil.png",
        text: "Cook",
        time: "5h ago",
        likes: "32",
        link: "https://x.com/UTDSahil_/status/2043339410557837358"
      },
     {
    username: "Abhishe59502815",
    handle: "@Abhishe59502815",
    avatar: "/tweets/abhishek.png",         // agar image ka naam alag hai toh change kar dena
    text: "woohh! crazy idea making a platform unified for all protocols. Love to try it..",
    time: "3h ago",
    likes: "28",
    link: "https://x.com/Abhishe59502815/status/2043692131353825767"
  },
  {
    username: "ImDT29",
    handle: "@ImDT29",
    avatar: "/tweets/devesh.png",           // agar image ka naam alag hai toh change kar dena
    text: "OneTap Earn made yield farming actually fun. No more jumping between 10 tabs. Connect → Ask AI → Deposit. Done.",
    time: "4h ago",
    likes: "41",
    link: "https://x.com/ImDT29/status/2043581020528840966"
  }
    ].map((tweet, index) => (
      <a
        key={index}
        href={tweet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-[#1A1A24] border border-[#2A2A36] hover:border-[#3A3A46] rounded-3xl p-5 transition-all duration-200 hover:shadow-xl"
      >
        {/* Header - Exact X Style */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-white/10">
              {/* Placeholder for avatar */}
              <span className="text-white text-xl font-bold">𝕏</span>
            </div>
            {/* Green online dot like your screenshot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1A1A24]"></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[15px] truncate">{tweet.username}</span>
              <span className="text-[#1DA1F2] text-xs">✓</span>
            </div>
            <div className="text-[#71767B] text-sm">{tweet.handle}</div>
          </div>

          <div className="text-[#1DA1F2] text-2xl opacity-80">𝕏</div>
        </div>

        {/* Tweet Text - Exact font & spacing */}
        <p className="text-[15px] leading-[1.4] text-white mb-5">
          {tweet.text}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#71767B]">
          <div>{tweet.time}</div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1">
              ❤️ <span>{tweet.likes}</span>
            </div>
            <div>↻</div>
            <div>💬</div>
          </div>
        </div>
      </a>
    ))}
  </div>
</section>
<section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
  <div className="text-center mb-10">
  </div>

  <FamewallEmbed />
</section>
    </main>
  );
}
