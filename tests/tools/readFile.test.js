import test from "node:test";
import assert from "node:assert/strict";

import readFile from "../../tools/core/readFile.js";
import { ToolError } from "../../errors/ToolError.js";

test("core/readFile throws ToolError on missing path", async () => {
    try {
        await readFile({});
        assert.fail("Expected ToolError to be thrown");
    } catch (err) {
        assert.ok(err instanceof ToolError);
        assert.equal(err.code, "INVALID_PARAMS");
        assert.match(err.message, /Missing 'path'/);
    }
});
