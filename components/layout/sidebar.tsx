"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  LayoutDashboard,
  Bot,
  Layers,
  Wallet,
  TrendingUp,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

const NAV_ITEMS = [
  { href: "/dashboard/home", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/ask-ai", icon: Bot, label: "Ask AI" },
  { href: "/dashboard/get-yield", icon: Layers, label: "Get Yield" },
  { href: "/dashboard/portfolio", icon: Wallet, label: "Portfolio" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col",
          "glass border-r border-white/[0.06]",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center green-glow-sm">
              <TrendingUp size={15} className="text-brand-navy" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">OneTap Earn</div>
              <div className="text-[10px] text-muted-foreground">DeFi Yield</div>
            </div>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">
            Menu
          </div>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeSidebar}
                className={cn("nav-item group", active ? "nav-item-active" : "nav-item-inactive")}
              >
                <Icon size={18} className={active ? "text-brand-green" : ""} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="text-brand-green/60" />}
              </Link>
            );
          })}

          {/* Quick Earn CTA */}
          <div className="pt-4">
            <Link
              href="/dashboard/get-yield"
              onClick={closeSidebar}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green text-sm font-medium hover:bg-brand-green/15 transition-colors"
            >
              <Zap size={16} />
              Quick Earn
            </Link>
          </div>
        </nav>

        {/* Wallet section */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>

        {/* LI.FI badge */}
        <div className="px-4 pb-4">
          <div className="text-[10px] text-muted-foreground text-center">
            Powered by{" "}
            <a href="https://li.fi" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">
              LI.FI
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden glass border-t border-white/[0.06] pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                active ? "text-brand-green" : "text-muted-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
