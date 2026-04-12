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

  const systemPrompt = `You are OneTap Earn's AI yield advisor with LIVE DeFi data.

📊 LIVE MARKET (${new Date().toUTCString()})
• Vaults tracked: ${vaults.length}
• Total TVL: $${(totalTVL / 1e9).toFixed(2)}B
• Platform avg APY: ${avgApy.toFixed(2)}%

🏆 TOP 5 BY APY:
${top5Apy.map((v, i) => `${i + 1}. ${v.name} (${v.protocol}) ${v.apy.toFixed(2)}% APY | ${v.chain} | TVL $${(v.tvlUSD / 1e6).toFixed(1)}M | ${v.risk} risk`).join("\n")}

🔒 TOP 5 LOW-RISK:
${lowRisk.map((v, i) => `${i + 1}. ${v.name} (${v.protocol}) ${v.apy.toFixed(2)}% | ${v.chain} | TVL $${(v.tvlUSD / 1e6).toFixed(1)}M`).join("\n")}

💰 HIGHEST TVL:
${top5Tvl.map((v, i) => `${i + 1}. ${v.name} — $${(v.tvlUSD / 1e6).toFixed(1)}M TVL | ${v.apy.toFixed(2)}% APY`).join("\n")}

FULL VAULT DATA:
${JSON.stringify(vaultList)}
${vaultContext ? `\nFOCUS VAULT:\n${JSON.stringify(vaultContext)}` : ""}

RULES:
1. Use ONLY real APY/TVL numbers from the data above — never output 0% unless it truly is 0.
2. Format: use emoji headers, **bold** for key numbers, bullet points.
3. For vault picks, end with: VAULTS_JSON:[array of vault objects from data above]
4. Earnings math: monthly = amount * apy/100/12, yearly = amount * apy/100.
5. Match user language (English/Hindi/Hinglish).
6. If data has real APY values, use them. Never say "0.00% APY" for known protocols.`;

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
