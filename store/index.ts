import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vault } from "@/lib/lifi";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  vaults?: Vault[];
  timestamp: number;
}

interface AppState {
  // Wallet
  isConnected: boolean;
  address: string | null;
  setConnected: (connected: boolean, address?: string) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;

  // Vaults
  selectedVaults: Vault[];
  toggleVaultSelection: (vault: Vault) => void;
  clearSelection: () => void;

  // Copilot drawer
  copilotOpen: boolean;
  copilotVault: Vault | null;
  openCopilot: (vault: Vault) => void;
  closeCopilot: () => void;

  // Mobile sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Compare modal
  compareOpen: boolean;
  setCompareOpen: (open: boolean) => void;

  // Deposit modal
  depositVault: Vault | null;
  depositOpen: boolean;
  openDeposit: (vault: Vault) => void;
  closeDeposit: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Wallet
      isConnected: false,
      address: null,
      setConnected: (connected, address) =>
        set({ isConnected: connected, address: address || null }),

      // Chat
      messages: [],
      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...msg, id: Math.random().toString(36).slice(2), timestamp: Date.now() },
          ],
        })),
      clearMessages: () => set({ messages: [] }),

      // Vaults
      selectedVaults: [],
      toggleVaultSelection: (vault) =>
        set((state) => {
          const exists = state.selectedVaults.find((v) => v.id === vault.id);
          if (exists) return { selectedVaults: state.selectedVaults.filter((v) => v.id !== vault.id) };
          if (state.selectedVaults.length >= 4) return state;
          return { selectedVaults: [...state.selectedVaults, vault] };
        }),
      clearSelection: () => set({ selectedVaults: [] }),

      // Copilot
      copilotOpen: false,
      copilotVault: null,
      openCopilot: (vault) => set({ copilotOpen: true, copilotVault: vault }),
      closeCopilot: () => set({ copilotOpen: false }),

      // Mobile sidebar
      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),

      // Compare
      compareOpen: false,
      setCompareOpen: (open) => set({ compareOpen: open }),

      // Deposit
      depositVault: null,
      depositOpen: false,
      openDeposit: (vault) => set({ depositVault: vault, depositOpen: true }),
      closeDeposit: () => set({ depositOpen: false }),
    }),
    {
      name: "onetap-earn",
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
