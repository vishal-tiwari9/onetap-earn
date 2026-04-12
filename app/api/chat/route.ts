import { NextRequest, NextResponse } from "next/server";
import { fetchVaults } from "@/lib/lifi";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE = "https://api.groq.com/openai/v1";

export async function POST(req: NextRequest) {
  try {
    const { messages, vaultContext } = await req.json();

    // Always fetch live vault data from LI.FI
    let vaults: Awaited<ReturnType<typeof fetchVaults>> = [];
    try {
      vaults = await fetchVaults({ sortBy: "apy", limit: 30 });
    } catch (e) {
      console.error("Failed to fetch live vaults for AI context:", e);
    }

    const topByApy = [...vaults].sort((a, b) => b.apy - a.apy).slice(0, 5);
    const topByTvl = [...vaults].sort((a, b) => b.tvlUSD - a.tvlUSD).slice(0, 5);
    const lowRisk = vaults.filter((v) => v.risk === "Low").slice(0, 5);
    const totalTVL = vaults.reduce((s, v) => s + v.tvlUSD, 0);
    const avgApy = vaults.length ? vaults.reduce((s, v) => s + v.apy, 0) / vaults.length : 0;

    const vaultTable = vaults.slice(0, 20).map((v) => ({
      id: v.id,
      name: v.name,
      protocol: v.protocol,
      chain: v.chain,
      chainId: v.chainId,
      address: v.address,
      asset: v.asset.symbol,
      apy: parseFloat(v.apy.toFixed(2)),
      apyBase: v.apyBase ? parseFloat(v.apyBase.toFixed(2)) : null,
      apyReward: v.apyReward ? parseFloat(v.apyReward.toFixed(2)) : null,
      tvlUSD: v.tvlUSD,
      risk: v.risk,
      category: v.category,
      description: v.description ?? null,
    }));

    const systemPrompt = `You are OneTap Earn's AI yield advisor. You have access to LIVE, REAL-TIME data from LI.FI's DeFi earn platform.

═══════════════════════════════════════
📊 LIVE MARKET SNAPSHOT (${new Date().toUTCString()})
═══════════════════════════════════════
Total vaults tracked: ${vaults.length}
Platform total TVL: $${(totalTVL / 1e9).toFixed(2)}B
Average APY across all vaults: ${avgApy.toFixed(2)}%

🏆 TOP 5 BY APY RIGHT NOW:
${topByApy.map((v, i) => `  ${i + 1}. ${v.name} (${v.protocol}) — ${v.apy.toFixed(2)}% APY | ${v.chain} | TVL: $${(v.tvlUSD / 1e6).toFixed(1)}M | Risk: ${v.risk}`).join("\n")}

🔒 TOP 5 LOW-RISK VAULTS:
${lowRisk.map((v, i) => `  ${i + 1}. ${v.name} (${v.protocol}) — ${v.apy.toFixed(2)}% APY | ${v.chain} | TVL: $${(v.tvlUSD / 1e6).toFixed(1)}M`).join("\n")}

💰 TOP 5 BY TVL (most trusted):
${topByTvl.map((v, i) => `  ${i + 1}. ${v.name} — TVL: $${(v.tvlUSD / 1e6).toFixed(1)}M | APY: ${v.apy.toFixed(2)}% | ${v.chain}`).join("\n")}

FULL VAULT DATA (for recommendations):
${JSON.stringify(vaultTable, null, 2)}

${vaultContext ? `\n📌 CURRENTLY VIEWING:\n${JSON.stringify(vaultContext, null, 2)}` : ""}
═══════════════════════════════════════

RESPONSE RULES — FOLLOW EXACTLY:
1. ALWAYS use real numbers from the live data above. Never make up APY or TVL figures.
2. Structure every response with clear emoji sections. Use bold **text** for key numbers.
3. For vault recommendations, append a special JSON block AT THE END (after all text):
   VAULTS_JSON:[array of vault objects from the data above]
4. When recommending vaults, pick from the actual vaultTable data — use exact IDs and addresses.
5. For earnings calculations: show monthly = amount × APY/12, yearly = amount × APY.
6. Language: match the user's language (English, Hindi, Hinglish all fine).
7. Risk guidance: Low risk = TVL >$100M + APY <15%. Always mention the risk level clearly.
8. Keep responses punchy — use bullet points, emojis for sections, bold for numbers.
9. End every response with ONE clear next-step suggestion.
10. If asked about a specific amount (like "500 USDC"), calculate actual earnings and show them.

RESPONSE FORMAT TEMPLATE:
🎯 **[headline answer in one line]**

📈 **Top Picks:**
• Protocol Name — **X.XX% APY** | Chain | 🟢 Low Risk | TVL: $XXM
• ...

💰 **If you deposit $[amount]:**
• Monthly: +$XX
• Yearly: +$XX

⚠️ **Risk Note:** [one line]

[any extra context]

VAULTS_JSON:[...]`;

    if (!GROQ_API_KEY) {
      return NextResponse.json({
        error: "GROQ_API_KEY not configured. Add it to .env.local",
        content: `⚠️ **AI advisor not configured.**\n\nAdd your Groq API key to \`.env.local\`:\n\`\`\`\nGROQ_API_KEY=your_key_from_console.groq.com\n\`\`\`\n\nLive vault data is still loading on the Get Yield page!`,
      });
    }

    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12),
        ],
        max_tokens: 1024,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: `Groq API error: ${res.status}`, content: "AI service error. Please try again." },
        { status: 500 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "No response from AI.";
    return NextResponse.json({ content, vaultCount: vaults.length });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Internal error", content: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
