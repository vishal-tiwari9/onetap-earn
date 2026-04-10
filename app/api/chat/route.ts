import { NextRequest, NextResponse } from "next/server";
import { fetchVaults } from "@/lib/lifi";

const GROK_API_KEY = process.env.GROK_API_KEY || "";
const GROK_BASE = "https://api.x.ai/v1";

export async function POST(req: NextRequest) {
  try {
    const { messages, vaultContext } = await req.json();

    // Fetch live vaults for context
    const vaults = await fetchVaults({ sortBy: "apy", limit: 20 });
    const vaultSummary = vaults.slice(0, 10).map((v) => ({
      name: v.name,
      protocol: v.protocol,
      chain: v.chain,
      asset: v.asset.symbol,
      apy: v.apy.toFixed(2) + "%",
      tvl: "$" + (v.tvlUSD / 1e6).toFixed(1) + "M",
      risk: v.risk,
      category: v.category,
    }));

    const systemPrompt = `You are OneTap Earn's AI yield advisor — friendly, concise, and expert in DeFi.
You help users find the best yield opportunities using LI.FI's Earn platform.

AVAILABLE VAULTS (live data):
${JSON.stringify(vaultSummary, null, 2)}

${vaultContext ? `SELECTED VAULT CONTEXT:\n${JSON.stringify(vaultContext, null, 2)}` : ""}

RULES:
- Be conversational and avoid heavy crypto jargon.
- When recommending vaults, always mention: APY, risk level, TVL (trust indicator), and chain.
- Risk logic: High TVL (>$100M) + moderate APY = Low risk. High APY + low TVL = High risk.
- Format vault recommendations as JSON at the end of your message like:
  VAULTS_JSON:[{"id":"...","name":"...","protocol":"...","apy":8.4,"tvlUSD":450000000,"risk":"Low","chain":"Arbitrum","asset":{"symbol":"USDC"},"category":"Lending","chainId":42161,"address":"0x..."}]
- Keep responses under 200 words unless explaining complex topics.
- Support Hindi/Hinglish queries naturally — respond in the same language the user uses.
- Always end with a gentle nudge to deposit or ask a follow-up question.`;

    if (!GROK_API_KEY) {
      // Fallback mock response
      return NextResponse.json({
        content: getMockResponse(messages[messages.length - 1]?.content || "", vaults),
      });
    }

    const res = await fetch(`${GROK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10), // last 10 messages for context
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Grok API error:", err);
      return NextResponse.json({
        content: getMockResponse(messages[messages.length - 1]?.content || "", vaults),
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "I couldn't process that. Please try again.";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getMockResponse(query: string, vaults: ReturnType<typeof Array.prototype.slice>) {
  const q = query.toLowerCase();

  if (q.includes("safe") || q.includes("low risk") || q.includes("usdc")) {
    const safeVaults = (vaults as { risk?: string; id: string; name: string; protocol: string; apy: number; tvlUSD: number; chain: string; asset: { symbol: string }; category: string; chainId: number; address: string }[]).filter((v) => v.risk === "Low").slice(0, 3);
    return `Great question! For safe USDC yield, I'd recommend these top picks based on current live data:

**🟢 Low Risk Options:**
${safeVaults.map((v) => `• **${v.name}** — ${v.apy.toFixed(2)}% APY on ${v.chain} (TVL: $${(v.tvlUSD / 1e6).toFixed(0)}M)`).join("\n")}

These are considered safe because they have massive TVL (billions locked in), are battle-tested protocols, and have never been exploited.

Want me to help you deposit into one? Or would you like to compare them side by side?

VAULTS_JSON:${JSON.stringify(safeVaults.map((v) => ({ ...v, risk: "Low" })))}`;
  }

  if (q.includes("best") || q.includes("high apy") || q.includes("zyada")) {
    const topVaults = [...(vaults as { apy: number; id: string; name: string; protocol: string; tvlUSD: number; risk?: string; chain: string; asset: { symbol: string }; category: string; chainId: number; address: string }[])].sort((a, b) => b.apy - a.apy).slice(0, 3);
    return `Here are the **highest yield vaults** right now! 🚀

${topVaults.map((v, i) => `**${i + 1}. ${v.name}** — ${v.apy.toFixed(2)}% APY\n   ${v.protocol} on ${v.chain} | Risk: ${v.risk || "Medium"} | TVL: $${(v.tvlUSD / 1e6).toFixed(0)}M`).join("\n\n")}

⚠️ Higher APY often means higher risk. The Pendle vault has the best yield but requires more expertise.

Which one interests you? I can explain any of them in detail!

VAULTS_JSON:${JSON.stringify(topVaults)}`;
  }

  if (q.includes("compare") || q.includes("vs") || q.includes("difference")) {
    return `To compare vaults, I recommend looking at three things:
    
1. **APY** — How much you earn annually
2. **TVL** — Bigger = more trust and liquidity  
3. **Risk** — Low risk = battle-tested protocols with large TVL

Use the Compare feature on the Get Yield page to see side-by-side charts! Or tell me which specific protocols you want to compare and I'll break it down for you. 📊`;
  }

  // Default helpful response
  const topVault = (vaults as { apy: number; id: string; name: string; protocol: string; tvlUSD: number; risk?: string; chain: string; asset: { symbol: string }; category: string; chainId: number; address: string }[])[0];
  return `Great question! 👋 I'm your OneTap Earn AI advisor.

Right now, the top opportunity I see is the **${topVault?.name}** offering **${topVault?.apy?.toFixed(2)}% APY** — that's a solid return with ${topVault?.risk || "medium"} risk.

Here are some things I can help you with:
• Find the **safest** yield for your USDC/USDT
• Compare protocols by APY, risk, and chain
• Explain how any vault works in simple terms
• Calculate potential earnings on any amount

What would you like to explore? Just ask in plain English (or Hinglish!) 😊`;
}
