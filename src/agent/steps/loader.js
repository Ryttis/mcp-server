/**
 * Universal Agent — Step Loader (v1)
 *
 * Loads primitive steps by ID.
 * Only handles primitives in v1.
 * AI steps integrate later through this same mechanism.
 */

import * as primitives from "./primitives/index.js";
import * as ai from "./ai/index.js";

/**
 * Return the step implementation for a given ID.
 * @param {string} id
 * @returns {object} step implementation { run() }
 */

export function loadPrimitiveStep(id) {
    if (primitives[id]) return primitives[id];
    if (ai[id]) return ai[id];

    throw new Error(`Unknown step ID: '${id}'`);
}

