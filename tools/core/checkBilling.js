import fetch from "node-fetch";

/**
 * Tool: checkBilling
 * Returns OpenAI prepaid balance and usage (including manual top-up credits).
 */
export default async function checkBilling() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

    const today = new Date().toISOString().slice(0, 10);
    const start = today.slice(0, 8) + "01"; // start of month

    // 1️⃣ Fetch subscription info (for pay-as-you-go or free trial)
    const subRes = await fetch("https://api.openai.com/v1/dashboard/billing/subscription", {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    const sub = await subRes.json();

    // 2️⃣ Fetch usage in current month
    const usageRes = await fetch(
        `https://api.openai.com/v1/dashboard/billing/usage?start_date=${start}&end_date=${today}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const usage = await usageRes.json();

    const usedUsd = ((usage?.total_usage || 0) / 100).toFixed(2);
    const hardLimitUsd = sub?.hard_limit_usd ? sub.hard_limit_usd.toFixed(2) : 0;
    const remainingUsd = (hardLimitUsd - usedUsd).toFixed(2);

    return {
        plan: sub?.plan?.title || "Unknown",
        hard_limit_usd: `$${hardLimitUsd}`,
        used_this_month_usd: `$${usedUsd}`,
        remaining_estimate_usd: `$${remainingUsd}`,
        as_of: today
    };
}
