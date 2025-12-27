import test from "node:test";
import assert from "assert";
import analyzeFile from "../../tools/core/analyzeFile.js";

test("core/analyzeFile rejects missing path", async () => {
    await assert.rejects(
        () => analyzeFile({}),
        (e) => e.code === "INVALID_INPUT"
    );
});
