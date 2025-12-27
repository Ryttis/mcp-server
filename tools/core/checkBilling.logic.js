import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for checkBilling tool.
 * Calculates billing summary from API responses.
 */
export async function checkBillingLogic(_params = {}, io) {
    const apiKey = io.getApiKey();
    if (!apiKey) {
        throw new ToolError(
            "MISSING_ENV",
            "Missing OPENAI_API_KEY"
        );
    }

    const today = io.todayISO();
    const start = today.slice(0, 8) + "01";

    const sub = await io.fetchSubscription(apiKey);
    const usage = await io.fetchUsage(apiKey, start, today);

    const usedUsd = ((usage?.total_usage || 0) / 100).toFixed(2);
    const hardLimitUsd = sub?.hard_limit_usd
        ? sub.hard_limit_usd.toFixed(2)
        : 0;
    const remainingUsd = (hardLimitUsd - usedUsd).toFixed(2);

    return {
        plan: sub?.plan?.title || "Unknown",
        hard_limit_usd: `$${hardLimitUsd}`,
        used_this_month_usd: `$${usedUsd}`,
        remaining_estimate_usd: `$${remainingUsd}`,
        as_of: today
    };
}
