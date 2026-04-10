"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Menu } from "lucide-react";
import { Sidebar, MobileBottomNav } from "@/components/layout/sidebar";
import { useAppStore } from "@/store";
import { DepositModal } from "@/components/modals/deposit-modal";
import { CopilotDrawer } from "@/components/modals/copilot-drawer";
import { CompareModal } from "@/components/modals/compare-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { toggleSidebar } = useAppStore();

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-brand-navy flex">
      <Sidebar />

      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass border-b border-white/[0.06] sticky top-0 z-20">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-green/20 flex items-center justify-center">
              <span className="text-brand-green text-xs font-bold">OE</span>
            </div>
            <span className="font-semibold text-sm">OneTap Earn</span>
          </div>
          <div className="w-8" /> {/* spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <DepositModal />
      <CopilotDrawer />
      <CompareModal />
    </div>
  );
}
