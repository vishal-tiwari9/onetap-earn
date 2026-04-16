"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { TrendingUp, Shield, Zap, Globe, ArrowRight, Star,ExternalLink } from "lucide-react";
import FamewallEmbed from "@/components/FamewallEmbed";

import Image from "next/image"; // If using Next.js, or just use <img />

// 1. Updated Data with Avatar Paths
const testimonials = [
  {
    username: "tiwaridevesh",
    handle: "tiwaridevesh",
    avatar: "/tweets/devesh.png", // Added
    text: "@VishalT12094272 @lifiprotocol Crazy Idea bro ...i was literally waiting for such product ...let me know ..once its is live to use",
    time: "10h ago",
    likes: "4",
    id: "2043581020528840966",
    verified: true,
  },
  {
    username: "SahilYadav199",
    handle: "SahilYadav199",
    avatar: "/tweets/yadav-sahil.png", // Added
    text: "Damn this is actually a solid idea, nicely built! Comparing protocols in one place + AI guidance is actually super useful.",
    time: "2h ago",
    likes: "3",
    id: "2043710350345003372",
    verified: true,
  },
  {
    username: "FYMarafi54",
    handle: "FYMarafi54",
    avatar: "/tweets/fymarafi54.png", // Replace with actual path
    text: "risk filter idea goes hard🔥",
    time: "1h ago",
    likes: "2",
    id: "2044268755715535148",
    verified: true,
  },
  {
    username: "shivamtiwari",
    handle: "_shivamtiwari9",
    avatar: "/tweets/shivam.png", // Added
    text: "Great Project @VishalT12094272... Would love to try this",
    time: "30m ago",
    likes: "2",
    id: "2044299474827391281",
    verified: true,
  },
  {
    username: "UTDSahil_",
    handle: "UTDSahil_",
    avatar: "/tweets/utd_sahil.png", // Added
    text: "Cook",
    time: "5h ago",
    likes: "2",
    id: "2043339410557837358",
    verified: true,
  },
  {
    username: "Abhishe59502815",
    handle: "Abhishe59502815",
    avatar: "/tweets/abhishek.png", // Added
    text: "woohh! crazy idea making a platform unified for all protocols. Love to try it",
    time: "2h ago",
    likes: "3",
    id: "2043692131353825767",
    verified: false
  },
   {
    username: "tiwaridevesh",
    handle: "tiwaridevesh",
    avatar: "/tweets/devesh.png", // Added
    text: "U got a User for this product ....really loved this",
    time: "1D ago",
    likes: "4",
    id: "2043581215786365376",
    verified: true,
  },
];

// 2. Updated Sub-Component
const XTweetCard = ({ tweet }: { tweet: (typeof testimonials)[0] }) => {
  const tweetUrl = `https://x.com/${tweet.handle}/status/${tweet.id}`;
  
  const likeUrl = `https://x.com/intent/like?tweet_id=${tweet.id}`;
  const retweetUrl = `https://x.com/intent/retweet?tweet_id=${tweet.id}`;
  const replyUrl = `https://x.com/intent/tweet?in_reply_to=${tweet.id}`;

  const openIntent = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "width=550,height=420");
  };

  return (
    <a 
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block bg-[#16181C] border border-[#2F3336] hover:border-[#333639] hover:bg-[#1c1f23] rounded-2xl p-8 m-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(29,155,240,0.1)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-3">
          <div className="relative flex-shrink-0">
            {/* --- Profile Photo Section --- */}
            <div className="w-11 h-11 rounded-full bg-zinc-800 ring-1 ring-white/10 overflow-hidden">
              {tweet.avatar ? (
                <img 
                  src={tweet.avatar} 
                  alt={tweet.username} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${tweet.username}&background=random`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                   {tweet.username[0].toUpperCase()}
                </div>
              )}
            </div>
            {/* Online Indicator/Dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00BA7C] rounded-full border-2 border-[#16181C]"></div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px] text-white group-hover:underline decoration-white/50">
                {tweet.username}
              </span>
              {tweet.verified && (
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-[#1d9bf0]">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96 1.41 1.41-6.37 6.37z" />
                </svg>
              )}
            </div>
            <span className="text-[#71767B] text-[15px]">@{tweet.handle}</span>
          </div>
        </div>
        
        {/* X Logo */}
        <div className="text-[#71767B] opacity-40 group-hover:opacity-100 group-hover:text-[#1d9bf0] transition-all">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      </div>

      <p className="text-[15px] leading-normal text-white mb-4 whitespace-pre-wrap">
        {tweet.text}
      </p>

      <div className="text-[#71767B] text-[14px] mb-3 border-b border-[#2F3336] pb-3">
        {tweet.time}
      </div>

      {/* Interaction Footer */}
      <div className="flex items-center justify-between max-w-[280px] text-[#71767B]">
        <button onClick={(e) => openIntent(e, replyUrl)} className="p-2 -ml-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0]">💬</button>
        <button onClick={(e) => openIntent(e, retweetUrl)} className="p-2 rounded-full hover:bg-[#00ba7c]/10 hover:text-[#00ba7c]">↻</button>
        <button onClick={(e) => openIntent(e, likeUrl)} className="flex items-center gap-1.5 p-2 rounded-full hover:bg-[#f91880]/10 hover:text-[#f91880]">
          ❤️ <span className="text-xs">{tweet.likes}</span>
        </button>
      </div>
    </a>
  );
};

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
  <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-sm font-medium mb-4">
             𝕏 Feed
          </div>
        
        </div>

        {/* Masonry-style Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t, i) => (
            <div key={i} className="break-inside-avoid">
              <XTweetCard tweet={t} />
            </div>
          ))}
        </div>
      </section>
        </div>
</section>
    </main>
  );
}
