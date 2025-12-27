import test from "node:test";
import assert from "node:assert/strict";

import ping from "../../tools/core/ping.js";

test("core/ping returns a response", async () => {
    const res = await ping({});

    assert.ok(res, "ping should return a result object");
});
