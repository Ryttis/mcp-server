import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import os from "os";

import writeFile from "../../tools/core/writeFile.js";

test("core/writeFile writes file content", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-"));
    const filePath = path.join(tmpDir, "test.txt");

    const content = "hello mcp";

    const res = await writeFile({ path: filePath, content });

    assert.ok(res);
    assert.match(res.message, /written/);

    const saved = await fs.readFile(filePath, "utf8");
    assert.equal(saved, content);
});
