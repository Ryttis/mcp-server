/**
 * Primitive Step: validateDocOnly (v2 strict)
 *
 * Validates that AI-modified output differs from the original ONLY
 * by adding exactly ONE JSDoc block at the top of the file.
 */

import { logError, logStep } from "../../logging/logger.js";

/**
 * Extracts the first JSDoc block from content.
 */
function extractHeader(content) {
    const match = content.match(/^\/\*\*[\s\S]*?\*\//);
    return match ? match[0] : null;
}

/**
 * Removes the first JSDoc header (if any).
 */
function removeHeader(content) {
    return content.replace(/^\/\*\*[\s\S]*?\*\/\s*/, "");
}

export async function run(context) {
    const originals = context.filesContent || {};
    const aiOut = context.aiOutputs || {};
    const validated = {};

    logStep(context, "validateDocOnly", "Validating doc-only AI output…");

    for (const file of Object.keys(aiOut)) {
        const original = originals[file];
        const improved = aiOut[file];

        if (!original || !improved) {
            logError(context, `Missing content for ${file}`);
            continue;
        }

        // 1️⃣ Extract AI-added header
        const header = extractHeader(improved);

        if (!header) {
            logError(context, `AI did NOT include a JSDoc header for ${file}`);
            continue;
        }

        // 2️⃣ Remove header from improved version
        const bodyAfterHeader = removeHeader(improved).trim();
        const originalTrimmed = original.trim();

        // 3️⃣ Logic MUST match EXACTLY
        if (bodyAfterHeader !== originalTrimmed) {
            logError(context, `Logic changed in file ${file}. Doc-only violation.`);
            continue;
        }

        // 4️⃣ MUST NOT modify original header if exists
        if (extractHeader(original)) {
            logError(context, `Original already contains JSDoc header. Doc-only recipe is not allowed.`);
            continue;
        }

        validated[file] = improved;
    }

    return {
        mutations: {
            validatedOutputs: validated
        }
    };
}
