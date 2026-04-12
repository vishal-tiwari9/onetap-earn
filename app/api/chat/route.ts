import { NextRequest, NextResponse } from "next/server";
import { fetchVaults, type Vault } from "@/lib/lifi";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE = "https://api.groq.com/openai/v1";

export async function POST(req: NextRequest) {
  const { messages, vaultContext } = await req.json();

  // Fetch live vaults
  let vaults: Vault[] = [];
  try {
    vaults = await fetchVaults({ limit: 50 });
  } catch (e) {
    console.error("Vault fetch error:", e);
  }

  const top5Apy = [...vaults].sort((a, b) => b.apy - a.apy).slice(0, 5);
  const top5Tvl = [...vaults].sort((a, b) => b.tvlUSD - a.tvlUSD).slice(0, 5);
  const lowRisk = vaults.filter((v) => v.risk === "Low").slice(0, 5);
  const avgApy = vaults.length ? vaults.reduce((s, v) => s + v.apy, 0) / vaults.length : 0;
  const totalTVL = vaults.reduce((s, v) => s + v.tvlUSD, 0);

  // Minimal vault summary for prompt — only real data fields
  const vaultList = vaults.slice(0, 25).map((v) => ({
    id: v.id,
    name: v.name,
    protocol: v.protocol,
    chain: v.chain,
    chainId: v.chainId,
    address: v.address,
    asset: v.asset.symbol,
    apy: v.apy,          // already converted to percent e.g. 8.4
    apyBase: v.apyBase ?? null,
    apyReward: v.apyReward ?? null,
    tvlUSD: v.tvlUSD,
    risk: v.risk,
    category: v.category,
    description: v.description ?? null,
  }));

const systemPrompt = `You are OneTap Earn's expert AI Yield Advisor — a highly intelligent, helpful, and trustworthy DeFi assistant with real-time access to live vault data from LI.FI.

Current Market Snapshot (${new Date().toUTCString()}):
• Total Vaults Tracked: ${vaults.length}
• Total TVL Across Platform: $${(totalTVL / 1e9).toFixed(2)}B
• Average APY: ${avgApy.toFixed(2)}%
• Highest APY Available: ${top5Apy[0]?.apy.toFixed(2)}%

TOP 5 HIGHEST APY VAULTS (real data):
${top5Apy.map((v, i) => `${i+1}. ${v.name} • ${v.protocol} • ${v.apy.toFixed(2)}% APY • TVL $${(v.tvlUSD/1e6).toFixed(1)}M • ${v.chain} • ${v.risk} risk`).join("\n")}

TOP 5 LOW-RISK VAULTS:
${lowRisk.map((v, i) => `${i+1}. ${v.name} • ${v.protocol} • ${v.apy.toFixed(2)}% • TVL $${(v.tvlUSD/1e6).toFixed(1)}M • ${v.chain}`).join("\n")}

FULL LIVE VAULT DATA (use this only):
${JSON.stringify(vaultList, null, 2)}

${vaultContext ? `\nCURRENT FOCUS VAULT:\n${JSON.stringify(vaultContext, null, 2)}` : ""}

CORE RULES (never break these):
1. Always use REAL numbers from the data above. Never say 0%, 0.00%, or "—" unless the API actually returns it.
2. Be extremely descriptive, transparent, and educational.
3. Give personalized, actionable advice based on user's amount, risk tolerance, and chain preference.
4. Use emojis sparingly but effectively. Use **bold** for key numbers.
5. Always explain risk vs reward clearly.
6. Support Hinglish / Hindi if user uses it.
7. If user asks for recommendation, always give 2-3 options with clear pros/cons.
8. End every major recommendation with: "Would you like me to help you deposit into this vault right now?"

You are friendly, confident, and professional — like a premium wealth advisor who deeply understands DeFi.`;


  if (!GROQ_API_KEY) {
    return NextResponse.json({
      content: `⚠️ **Groq API key missing.**\n\nAdd \`GROQ_API_KEY=gsk_xxx\` to \`.env.local\`\n\nGet your key: https://console.groq.com/keys\n\n${vaults.length > 0 ? `Live data loaded: **${vaults.length} vaults**, top APY: **${top5Apy[0]?.apy.toFixed(2)}%** on ${top5Apy[0]?.protocol}` : ""}`,
    });
  }

  try {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12),
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq error:", err);
      return NextResponse.json({ content: "AI service unavailable. Please try again." }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      content: data.choices?.[0]?.message?.content ?? "No response.",
      vaultCount: vaults.length,
      avgApy: avgApy.toFixed(2),
    });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ content: "Error contacting AI service." }, { status: 500 });
  }
}
