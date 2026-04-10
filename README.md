# OneTap Earn 🌿

> **LI.FI DeFi Mullet Hackathon — Builder Edition April 2026**

A beautiful, mobile-first DeFi yield aggregator built with Next.js 15, wagmi, and the LI.FI Earn API.

## Tech Stack

- **Framework**: Next.js 15 App Router + TypeScript
- **Styling**: Tailwind CSS + custom design system
- **Wallet**: wagmi v2 + viem + RainbowKit
- **State**: Zustand (persisted chat history)
- **Charts**: Recharts
- **AI**: Grok API (xAI) with LI.FI vault context
- **DeFi**: LI.FI Earn API + Composer
- **PWA**: next-pwa (installable on mobile)

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd onetap-earn
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

## Environment Variables

```env
# WalletConnect Project ID (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# LI.FI API Key (get from portal.li.fi)
NEXT_PUBLIC_LIFI_API_KEY=your_lifi_api_key

# Grok API Key (get from console.x.ai)
GROK_API_KEY=your_grok_api_key
```

> **Note:** The app works without API keys using mock data — great for demos!

## Features

### 🏠 Dashboard
- Portfolio summary with earnings chart
- Quick stats (value, earnings, APY)
- Top vault recommendations
- AI advisor shortcut

### 🤖 Ask AI
- Full ChatGPT-style chat interface
- Powered by Grok API + live LI.FI vault data
- Supports English + Hinglish queries
- Returns personalized vault cards with Deposit buttons
- Persistent chat history via Zustand

### 💰 Get Yield
- Live vault grid from LI.FI Earn API (with mock fallback)
- Filter by: category, chain, asset, APY range
- Sort by: highest APY, highest TVL, lowest risk
- Multi-select for vault comparison
- "Ask AI" per vault → opens Copilot drawer

### 🤖 AI Copilot Drawer
- VS Code Copilot-style right drawer
- Vault-specific context passed to LLM
- Quick action buttons

### 📊 Compare
- Side-by-side comparison of 2-4 vaults
- APY history line chart (Recharts)
- TVL bar chart
- Full stats table

### 👤 Portfolio
- Bank-profile style summary
- Pie chart allocation + growth line chart
- Positions from LI.FI portfolio API
- Deposit more / Withdraw buttons

### 💳 Deposit Flow
- Single-page deposit modal
- Cross-chain detection + LI.FI bridge info
- Quote fetching from LI.FI quote API
- Real transaction execution via wagmi

## Project Structure

```
app/
  page.tsx                   # Landing page
  layout.tsx                 # Root layout
  dashboard/
    layout.tsx               # Dashboard shell (sidebar + mobile nav)
    page.tsx                 # Redirect → /dashboard/home
    home/page.tsx            # Dashboard home
    ask-ai/page.tsx          # AI chat interface
    get-yield/page.tsx       # Vault browser
    portfolio/page.tsx       # Portfolio view
  api/
    chat/route.ts            # Grok AI proxy API route

components/
  providers.tsx              # WagmiProvider + QueryClient + Toaster
  layout/
    sidebar.tsx              # Desktop sidebar + mobile bottom nav
  cards/
    vault-card.tsx           # Vault display card
  modals/
    deposit-modal.tsx        # Deposit flow modal
    copilot-drawer.tsx       # AI copilot right drawer
    compare-modal.tsx        # Vault comparison modal
  ui/
    skeleton.tsx             # Loading skeletons

lib/
  wagmi.ts                   # Wagmi + RainbowKit config
  lifi.ts                    # LI.FI API integration + mock data
  utils.ts                   # Formatting helpers

hooks/
  useVaults.ts               # Vault data fetching hook
  useDeposit.ts              # Deposit execution hook

store/
  index.ts                   # Zustand global store
```

## LI.FI Integration

- **Vault Discovery**: `GET https://earn.li.fi/v1/earn/vaults`
- **Portfolio**: `GET https://earn.li.fi/v1/earn/portfolio/{wallet}/positions`
- **Quotes**: `GET https://li.quest/v1/quote`
- All calls include `x-lifi-api-key` header
- Cross-chain deposits handled automatically via LI.FI Composer

## Build for Production

```bash
npm run build
npm start
```

## PWA Installation

On mobile: tap "Add to Home Screen" in your browser after visiting the app.
The sidebar automatically becomes a bottom navigation bar on mobile.

---

Built with ❤️ for the LI.FI DeFi Mullet Hackathon 2026
