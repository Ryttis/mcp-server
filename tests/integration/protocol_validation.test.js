import test from "node:test";
import assert from "assert";
import {
    validateRpcToolInput,
    warnOnInvalidRpcToolOutput
} from "../../src/server/rpc.js";

test("RPC validation skips tools without protocol schemas", () => {
    assert.doesNotThrow(() => {
        validateRpcToolInput("local.uncoveredTool", { anything: true });
        warnOnInvalidRpcToolOutput("local.uncoveredTool", { any: "shape" });
    });
});

test("RPC validation rejects invalid covered tool params", () => {
    assert.throws(
        () => validateRpcToolInput("core.memoryQuery", { bad: true }),
        (err) => err.code === "INVALID_PARAMS"
    );
});

test("RPC output validation accepts core.memoryIngest real result shape", () => {
    assert.doesNotThrow(() => {
        warnOnInvalidRpcToolOutput("core.memoryIngest", { ok: true, id: "test-id" });
    });
});
