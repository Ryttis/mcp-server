import test from "node:test";
import assert from "node:assert/strict";
import { createAnswerInterpreter, getInterpreterConfig } from "../../src/voice/answerInterpreter.js";

test("getInterpreterConfig defaults to provider none", () => {
    const config = getInterpreterConfig({});
    assert.equal(config.provider, "none");
    assert.equal(config.model, "gpt-4o-mini");
    assert.equal(config.openaiApiKey, "");
});

test("getInterpreterConfig reads env vars", () => {
    const config = getInterpreterConfig({
        VOICE_ANSWER_INTERPRETER_PROVIDER: "openai",
        VOICE_ANSWER_INTERPRETER_MODEL: "gpt-4.1",
        OPENAI_API_KEY: "sk-test"
    });
    assert.equal(config.provider, "openai");
    assert.equal(config.model, "gpt-4.1");
    assert.equal(config.openaiApiKey, "sk-test");
});

test("getInterpreterConfig falls back to none for unknown provider", () => {
    const config = getInterpreterConfig({ VOICE_ANSWER_INTERPRETER_PROVIDER: "unknown" });
    assert.equal(config.provider, "none");
});

test("interpreter provider=none returns disabled without calling fetch", async () => {
    let fetchCalled = false;
    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "none" },
        { fetch: async () => { fetchCalled = true; return new Response("{}"); } }
    );

    assert.equal(interpreter.enabled, false);
    const result = await interpreter.interpretAnswer({ text: "Taip, turiu" });
    assert.equal(result.disabled, true);
    assert.equal(fetchCalled, false);
});

test("interpreter provider=openai with empty text returns skipped", async () => {
    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        {}
    );

    const result = await interpreter.interpretAnswer({ text: "" });
    assert.equal(result.skipped, true);
    assert.equal(result.reason, "empty_transcript");
});

test("interpreter provider=openai without api key returns interpretationError", async () => {
    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai" },
        {}
    );

    const result = await interpreter.interpretAnswer({ text: "Taip, turiu" });
    assert.ok(result.interpretationError);
    assert.match(result.interpretationError, /OPENAI_API_KEY/);
});

function mockFetchInterpreter(jsonPayload) {
    return async (_url, _opts) => {
        return Response.json({
            choices: [{ message: { content: JSON.stringify(jsonPayload) } }]
        });
    };
}

test("interpreter parses valid openai JSON for has_part", async () => {
    const payload = {
        language: "lt",
        intent: "has_part",
        confidence: 0.95,
        summaryLt: "Pardavėjas turi priekinį kairės pusės žibintą",
        partMatched: true,
        sideMatched: true,
        mentionedPart: "priekinis žibintas",
        mentionedSide: "left",
        availability: "yes",
        followUpNeeded: false,
        followUpQuestionLt: null
    };

    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        { fetch: mockFetchInterpreter(payload) }
    );

    const result = await interpreter.interpretAnswer({
        text: "Taip, turiu priekinį kairės pusės žibintą",
        question: "Ar turite priekinį kairės pusės žibintą?"
    });

    assert.equal(result.disabled, false);
    assert.equal(result.skipped, false);
    assert.equal(result.intent, "has_part");
    assert.equal(result.availability, "yes");
    assert.equal(result.mentionedSide, "left");
    assert.equal(result.sideMatched, true);
    assert.equal(result.confidence, 0.95);
});

test("interpreter parses does_not_have_part", async () => {
    const payload = {
        language: "lt",
        intent: "does_not_have_part",
        confidence: 0.99,
        summaryLt: "Neturi detalės",
        partMatched: false,
        sideMatched: false,
        mentionedPart: null,
        mentionedSide: "unknown",
        availability: "no",
        followUpNeeded: false,
        followUpQuestionLt: null
    };

    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        { fetch: mockFetchInterpreter(payload) }
    );

    const result = await interpreter.interpretAnswer({ text: "Neturiu" });

    assert.equal(result.intent, "does_not_have_part");
    assert.equal(result.availability, "no");
});

test("interpreter parses has_alternative with wrong side", async () => {
    const payload = {
        language: "lt",
        intent: "has_alternative",
        confidence: 0.88,
        summaryLt: "Turi tik dešinės pusės",
        partMatched: true,
        sideMatched: false,
        mentionedPart: "žibintas",
        mentionedSide: "right",
        availability: "partial",
        followUpNeeded: true,
        followUpQuestionLt: "Ar domina dešinės pusės?"
    };

    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        { fetch: mockFetchInterpreter(payload) }
    );

    const result = await interpreter.interpretAnswer({ text: "Turiu tik dešinės pusės" });

    assert.equal(result.intent, "has_alternative");
    assert.equal(result.mentionedSide, "right");
    assert.equal(result.sideMatched, false);
    assert.equal(result.availability, "partial");
    assert.equal(result.followUpNeeded, true);
});

test("interpreter parses asked_to_repeat", async () => {
    const payload = {
        language: "lt",
        intent: "asked_to_repeat",
        confidence: 0.97,
        summaryLt: "Prašo pakartoti",
        partMatched: false,
        sideMatched: false,
        mentionedPart: null,
        mentionedSide: "unknown",
        availability: "unknown",
        followUpNeeded: true,
        followUpQuestionLt: null
    };

    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        { fetch: mockFetchInterpreter(payload) }
    );

    const result = await interpreter.interpretAnswer({ text: "Nesupratau, pakartokite" });

    assert.equal(result.intent, "asked_to_repeat");
    assert.equal(result.availability, "unknown");
});

test("interpreter normalizes invalid intent to unclear", async () => {
    const payload = {
        intent: "something_wrong",
        confidence: 0.5,
        summaryLt: "",
        partMatched: false,
        sideMatched: false,
        mentionedPart: null,
        mentionedSide: "unknown",
        availability: "unknown",
        followUpNeeded: false,
        followUpQuestionLt: null
    };

    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        { fetch: mockFetchInterpreter(payload) }
    );

    const result = await interpreter.interpretAnswer({ text: "Kažkas neaiškaus" });

    assert.equal(result.intent, "unclear");
});

test("interpreter returns interpretationError when model returns non-JSON", async () => {
    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        {
            fetch: async () => Response.json({
                choices: [{ message: { content: "I cannot respond with JSON." } }]
            })
        }
    );

    const result = await interpreter.interpretAnswer({ text: "Taip, turiu" });

    assert.ok(result.interpretationError);
    assert.match(result.interpretationError, /parse/i);
});

test("interpreter returns interpretationError on HTTP error", async () => {
    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        { fetch: async () => new Response("Unauthorized", { status: 401 }) }
    );

    const result = await interpreter.interpretAnswer({ text: "Taip, turiu" });

    assert.ok(result.interpretationError);
    assert.match(result.interpretationError, /401/);
});

test("interpreter returns interpretationError when fetch throws", async () => {
    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        { fetch: async () => { throw new Error("network timeout"); } }
    );

    const result = await interpreter.interpretAnswer({ text: "Taip, turiu" });

    assert.ok(result.interpretationError);
    assert.match(result.interpretationError, /network timeout/);
});

test("interpreter clamps confidence to 0-1 range", async () => {
    const interpreter = createAnswerInterpreter(
        { VOICE_ANSWER_INTERPRETER_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        {
            fetch: mockFetchInterpreter({
                intent: "has_part",
                confidence: 1.5,
                summaryLt: "",
                partMatched: true,
                sideMatched: false,
                mentionedPart: null,
                mentionedSide: "unknown",
                availability: "yes",
                followUpNeeded: false,
                followUpQuestionLt: null
            })
        }
    );

    const result = await interpreter.interpretAnswer({ text: "Taip" });
    assert.equal(result.confidence, 1.0);
});
