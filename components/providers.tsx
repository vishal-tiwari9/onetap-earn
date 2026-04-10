"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { Toaster } from "sonner";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00D4AA",
            accentColorForeground: "#0A0F1E",
            borderRadius: "large",
            overlayBlur: "small",
          })}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0D1526",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F0F4FF",
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
