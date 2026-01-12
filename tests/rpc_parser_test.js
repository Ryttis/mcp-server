
import { strict as assert } from 'assert';

// Minimal implementation of the parser logic for testing
function parseMessages(input) {
    input = input.trim();
    if (!input) return [];

    try {
        return [JSON.parse(input)];
    } catch (e) {
        if (!e.message.includes("Unexpected non-whitespace") && !e.message.includes("JSON at position")) {
            throw e;
        }
    }

    const messages = [];
    let depth = 0;
    let start = 0;
    let inString = false;
    let paramsEscape = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (inString) {
            if (paramsEscape) {
                paramsEscape = false;
            } else if (char === '\\') {
                paramsEscape = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            if (depth === 0) start = i;
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth === 0) {
                const chunk = input.slice(start, i + 1);
                messages.push(JSON.parse(chunk));
            }
        }
    }

    if (messages.length === 0 && input.length > 0) throw new Error("No valid JSON objects found");
    return messages;
}

// Tests
console.log("Running RPC Parser Tests...");

try {
    // 1. Single valid object
    const single = '{"jsonrpc": "2.0", "method": "foo"}';
    assert.deepEqual(parseMessages(single), [{ jsonrpc: "2.0", method: "foo" }]);
    console.log("✅ Single object passed");

    // 2. Two concatenated objects
    const double = '{"jsonrpc": "2.0", "method": "foo"}{"jsonrpc": "2.0", "method": "bar"}';
    assert.deepEqual(parseMessages(double), [
        { jsonrpc: "2.0", method: "foo" },
        { jsonrpc: "2.0", method: "bar" }
    ]);
    console.log("✅ Concatenated objects passed");

    // 3. Nested objects
    const nested = '{"params": {"a": 1}}{"params": {"b": 2}}';
    assert.deepEqual(parseMessages(nested), [
        { params: { a: 1 } },
        { params: { b: 2 } }
    ]);
    console.log("✅ Nested objects passed");

    // 4. String with braces
    const stringBrace = '{"key": "value with { brace }"}{"next": 1}';
    assert.deepEqual(parseMessages(stringBrace), [
        { key: "value with { brace }" },
        { next: 1 }
    ]);
    console.log("✅ Strings with braces passed");

    console.log("🎉 All tests passed!");
} catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
}
