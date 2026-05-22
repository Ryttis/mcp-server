import test from "node:test";
import assert from "assert";
import { buildChatCompletionRequest } from "../../tools/core/llmComplete.io.js";
import { llmCompleteLogic } from "../../tools/core/llmComplete.logic.js";

test("core.llmComplete imports without requiring OPENAI_API_KEY", async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
        const module = await import(`../../tools/core/llmComplete.js?import-test=${Date.now()}`);
        assert.equal(typeof module.default, "function");
    } finally {
        if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
    }
});

test("core.llmComplete validates prompt and shapes output", async () => {
    const result = await llmCompleteLogic(
        {
            prompt: "Write one sentence.",
            response_format: { type: "json_object" }
        },
        {
            async complete(request) {
                assert.equal(request.prompt, "Write one sentence.");
                assert.equal(request.model, "gpt-4o-mini");
                assert.deepEqual(request.response_format, { type: "json_object" });
                return { text: "Done." };
            }
        }
    );

    assert.deepEqual(result, { text: "Done." });
});

test("core.llmComplete rejects empty prompt", async () => {
    await assert.rejects(
        () => llmCompleteLogic({ prompt: " " }, { async complete() {} }),
        (err) => err.code === "INVALID_INPUT"
    );
});

test("core.llmComplete normalizes response_format json for OpenAI", () => {
    const request = buildChatCompletionRequest({
        prompt: "Return JSON.",
        model: "gpt-4o-mini",
        response_format: "json"
    });

    assert.deepEqual(request.response_format, { type: "json_object" });
});

test("core.llmComplete normalizes response_format json_object for OpenAI", () => {
    const request = buildChatCompletionRequest({
        prompt: "Return JSON.",
        model: "gpt-4o-mini",
        response_format: "json_object"
    });

    assert.deepEqual(request.response_format, { type: "json_object" });
});

test("core.llmComplete passes object response_format through for OpenAI", () => {
    const responseFormat = { type: "json_object" };
    const request = buildChatCompletionRequest({
        prompt: "Return JSON.",
        model: "gpt-4o-mini",
        response_format: responseFormat
    });

    assert.equal(request.response_format, responseFormat);
});

test("core.llmComplete omits undefined response_format for OpenAI", () => {
    const request = buildChatCompletionRequest({
        prompt: "Write one sentence.",
        model: "gpt-4o-mini"
    });

    assert.equal(Object.hasOwn(request, "response_format"), false);
});
