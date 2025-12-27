import test from "node:test";
import assert from "node:assert/strict";

import getTime from "../../tools/core/getTime.js";

test("core/getTime returns timestamp", async () => {
    const res = await getTime({});

    assert.ok(res);

    const value = res.now ?? res.time ?? res.timestamp;
    assert.ok(typeof value === "string", "timestamp should be a string");

    const d = new Date(value);
    assert.ok(!isNaN(d.getTime()), "timestamp should be a valid date");
});
