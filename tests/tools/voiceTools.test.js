import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { PassThrough } from "stream";

import { ToolError } from "../../errors/ToolError.js";
import { createCallStore } from "../../src/voice/callStore.js";
import { getTranscriptionConfig } from "../../src/voice/transcriptionProvider.js";
import { createTwilioVoiceRouteHandler } from "../../src/voice/twilioRoutes.js";
import { outboundCallLogic } from "../../tools/voice/outboundCall.logic.js";
import { getCallStatusLogic } from "../../tools/voice/getCallStatus.logic.js";
import { getCallResultLogic } from "../../tools/voice/getCallResult.logic.js";
import { transcribeLogic } from "../../tools/voice/transcribe.logic.js";
import { TOOL_REGISTRY_MAP } from "../../tools/index.js";

const validParams = {
    phoneNumber: "+37060000000",
    language: "lt-LT",
    purpose: "test_call",
    approved: true,
    script: {
        intro: "Laba diena, cia MCP bandomasis skambutis.",
        questions: ["Prasome pasakyti: testas pavyko."],
        closing: "Aciu. Viso gero."
    },
    gatherSpeech: true,
    record: false,
    metadata: {
        campaignId: null,
        sellerName: null
    }
};

async function makeVoiceIO(env = {}) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-voice-"));
    const storeDir = path.join(tmpDir, "data", "voice-calls");
    const store = createCallStore(storeDir);

    return {
        tmpDir,
        storeDir,
        io: {
            env,
            saveCall: (record) => store.save(record),
            getCall: (callId) => store.get(callId)
        }
    };
}

async function assertRejectsWithCode(fn, code) {
    await assert.rejects(
        fn,
        (err) => err instanceof ToolError && err.code === code
    );
}

test("voice.outboundCall valid mock call returns ok true and saves data/voice-calls record", async () => {
    const { io, storeDir } = await makeVoiceIO({
        VOICE_PROVIDER: "mock",
        VOICE_CALLS_ENABLED: "false",
        VOICE_ALLOWED_TEST_NUMBERS: "+37060000000,+37061111111"
    });

    const res = await outboundCallLogic(validParams, io);

    assert.equal(res.ok, true);
    assert.equal(res.dryRun, true);
    assert.equal(res.provider, "mock");
    assert.equal(res.status, "mock_queued");
    assert.equal(res.phoneNumber, "+37060000000");
    assert.equal(res.language, "lt-LT");
    assert.equal(res.purpose, "test_call");
    assert.equal(res.message, "Real calls are disabled.");
    assert.match(res.callId, /^mock-call-/);
    assert.match(res.createdAt, /^\d{4}-\d{2}-\d{2}T/);

    const savedPath = path.join(storeDir, `${res.callId}.json`);
    const saved = JSON.parse(await fs.readFile(savedPath, "utf8"));
    assert.equal(saved.callId, res.callId);
    assert.deepEqual(saved.scriptPreview, validParams.script);
});

test("voice.outboundCall rejects approved !== true", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37060000000" });
    await assertRejectsWithCode(
        () => outboundCallLogic({ ...validParams, approved: false }, io),
        "APPROVAL_REQUIRED"
    );
});

test("voice.outboundCall rejects missing phoneNumber", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37060000000" });
    const { phoneNumber, ...params } = validParams;
    await assertRejectsWithCode(() => outboundCallLogic(params, io), "INVALID_PARAMS");
});

test("voice.outboundCall rejects invalid phoneNumber", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37060000000" });
    await assertRejectsWithCode(
        () => outboundCallLogic({ ...validParams, phoneNumber: "37060000000" }, io),
        "INVALID_PARAMS"
    );
});

test("voice.outboundCall rejects language other than lt-LT", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37060000000" });
    await assertRejectsWithCode(
        () => outboundCallLogic({ ...validParams, language: "en-US" }, io),
        "UNSUPPORTED_LANGUAGE"
    );
});

test("voice.outboundCall rejects provider other than mock", async () => {
    const { io } = await makeVoiceIO({
        VOICE_PROVIDER: "other",
        VOICE_ALLOWED_TEST_NUMBERS: "+37060000000"
    });
    await assertRejectsWithCode(
        () => outboundCallLogic(validParams, io),
        "PROVIDER_NOT_IMPLEMENTED"
    );
});

test("voice.outboundCall rejects invalid responseMode", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37060000000" });
    await assertRejectsWithCode(
        () => outboundCallLogic({ ...validParams, responseMode: "invalid" }, io),
        "INVALID_PARAMS"
    );
});

test("voice.outboundCall respects VOICE_ALLOWED_TEST_NUMBERS", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37061111111" });
    await assertRejectsWithCode(
        () => outboundCallLogic(validParams, io),
        "PHONE_NUMBER_NOT_ALLOWED"
    );
});

test("voice.outboundCall includes warning when allowed numbers env is missing in mock mode", async () => {
    const { io } = await makeVoiceIO({ VOICE_PROVIDER: "mock" });
    const res = await outboundCallLogic(validParams, io);

    assert.deepEqual(res.warnings, [
        "VOICE_ALLOWED_TEST_NUMBERS is not set; mock call allowed only because provider=mock."
    ]);
});

test("voice.outboundCall stays dry-run when VOICE_CALLS_ENABLED is true in mock mode", async () => {
    const { io } = await makeVoiceIO({
        VOICE_PROVIDER: "mock",
        VOICE_CALLS_ENABLED: "true",
        VOICE_ALLOWED_TEST_NUMBERS: "+37060000000"
    });

    const res = await outboundCallLogic(validParams, io);

    assert.equal(res.dryRun, true);
    assert.deepEqual(res.warnings, [
        "VOICE_CALLS_ENABLED is true but provider=mock; real calls are still disabled."
    ]);
});

test("voice.outboundCall does not call any external provider", async () => {
    let saveCount = 0;
    const io = {
        env: {
            VOICE_PROVIDER: "mock",
            VOICE_ALLOWED_TEST_NUMBERS: "+37060000000"
        },
        async saveCall() {
            saveCount += 1;
        }
    };

    const res = await outboundCallLogic(validParams, io);

    assert.equal(res.provider, "mock");
    assert.equal(saveCount, 1);
});

test("voice.getCallStatus returns saved mock call status", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37060000000" });
    const call = await outboundCallLogic(validParams, io);

    const status = await getCallStatusLogic({ callId: call.callId }, io);

    assert.deepEqual(status, {
        ok: true,
        callId: call.callId,
        provider: "mock",
        providerCallSid: undefined,
        status: "mock_queued",
        createdAt: call.createdAt,
        updatedAt: undefined
    });
});

test("voice.getCallStatus returns safe error for unknown callId", async () => {
    const { io } = await makeVoiceIO();
    await assertRejectsWithCode(
        () => getCallStatusLogic({ callId: "mock-call-missing" }, io),
        "CALL_NOT_FOUND"
    );
});

test("voice.getCallResult returns mock transcript/result shape", async () => {
    const { io } = await makeVoiceIO({ VOICE_ALLOWED_TEST_NUMBERS: "+37060000000" });
    const call = await outboundCallLogic(validParams, io);

    const result = await getCallResultLogic({ callId: call.callId }, io);

    assert.deepEqual(result, {
        ok: true,
        callId: call.callId,
        provider: "mock",
        providerCallSid: undefined,
        status: "mock_queued",
        transcript: [],
        answers: [],
        summary: "Mock call only. No real call was placed."
    });
});

test("voice.getCallResult returns safe error for unknown callId", async () => {
    const { io } = await makeVoiceIO();
    await assertRejectsWithCode(
        () => getCallResultLogic({ callId: "mock-call-missing" }, io),
        "CALL_NOT_FOUND"
    );
});

test("voice tools are registered in the WebSocket RPC registry", () => {
    assert.equal(typeof TOOL_REGISTRY_MAP["voice.outboundCall"]?.handler, "function");
    assert.equal(typeof TOOL_REGISTRY_MAP["voice.getCallStatus"]?.handler, "function");
    assert.equal(typeof TOOL_REGISTRY_MAP["voice.getCallResult"]?.handler, "function");
    assert.equal(typeof TOOL_REGISTRY_MAP["voice.transcribe"]?.handler, "function");
});

test("transcription provider defaults to none and lt-LT", () => {
    assert.deepEqual(getTranscriptionConfig({}), {
        provider: "none",
        language: "lt-LT",
        openaiApiKey: "",
        openaiModel: "whisper-1",
        twilioAccountSid: "",
        twilioAuthToken: ""
    });
});

function twilioEnv(overrides = {}) {
    return {
        VOICE_PROVIDER: "twilio",
        VOICE_CALLS_ENABLED: "true",
        VOICE_ALLOWED_TEST_NUMBERS: "+37060000000",
        TWILIO_ACCOUNT_SID: "AC_test_account",
        TWILIO_AUTH_TOKEN: "test_auth_token",
        TWILIO_FROM_NUMBER: "+15551234567",
        PUBLIC_VOICE_BASE_URL: "https://voice.example.test",
        ...overrides
    };
}

function createMockTwilioClient(calls = []) {
    return {
        calls: {
            async create(payload) {
                calls.push(payload);
                return { sid: "CA1234567890abcdef", status: "queued" };
            }
        }
    };
}

test("voice.outboundCall twilio rejects when VOICE_CALLS_ENABLED is not true", async () => {
    const { io } = await makeVoiceIO(twilioEnv({ VOICE_CALLS_ENABLED: "false" }));
    await assertRejectsWithCode(() => outboundCallLogic(validParams, io), "CALLS_DISABLED");
});

test("voice.outboundCall twilio rejects when required env vars are missing", async () => {
    const { io } = await makeVoiceIO(twilioEnv({ TWILIO_AUTH_TOKEN: "" }));
    await assertRejectsWithCode(() => outboundCallLogic(validParams, io), "MISSING_TWILIO_CONFIG");
});

test("voice.outboundCall twilio rejects phone not in VOICE_ALLOWED_TEST_NUMBERS", async () => {
    const { io } = await makeVoiceIO(twilioEnv({ VOICE_ALLOWED_TEST_NUMBERS: "+37061111111" }));
    await assertRejectsWithCode(() => outboundCallLogic(validParams, io), "PHONE_NUMBER_NOT_ALLOWED");
});

test("voice.outboundCall twilio creates local record before API call", async () => {
    const { io, storeDir } = await makeVoiceIO(twilioEnv());
    io.createTwilioClient = async () => ({
        calls: {
            async create() {
                const files = await fs.readdir(storeDir);
                assert.equal(files.length, 1);
                const saved = JSON.parse(await fs.readFile(path.join(storeDir, files[0]), "utf8"));
                assert.match(saved.callId, /^twilio-call-/);
                assert.equal(saved.status, "creating");
                return { sid: "CA1234567890abcdef", status: "queued" };
            }
        }
    });

    const res = await outboundCallLogic(validParams, io);
    assert.equal(res.providerCallSid, "CA1234567890abcdef");
});

test("voice.outboundCall twilio saves record responseMode", async () => {
    const { io } = await makeVoiceIO(twilioEnv());
    io.createTwilioClient = async () => createMockTwilioClient();

    const res = await outboundCallLogic({ ...validParams, responseMode: "record" }, io);
    const saved = await io.getCall(res.callId);

    assert.equal(res.responseMode, "record");
    assert.equal(saved.responseMode, "record");
});

test("voice.outboundCall twilio calls client with expected payload and returns providerCallSid", async () => {
    const created = [];
    const { io } = await makeVoiceIO(twilioEnv());
    io.createTwilioClient = async () => createMockTwilioClient(created);

    const res = await outboundCallLogic(validParams, io);

    assert.equal(res.ok, true);
    assert.equal(res.dryRun, false);
    assert.equal(res.provider, "twilio");
    assert.equal(res.providerCallSid, "CA1234567890abcdef");
    assert.equal(res.message, "Twilio outbound call queued.");
    assert.match(res.callId, /^twilio-call-/);

    assert.equal(created.length, 1);
    assert.equal(created[0].to, "+37060000000");
    assert.equal(created[0].from, "+15551234567");
    assert.match(created[0].url, /\/voice\/twilio\/twiml\?callId=twilio-call-/);
    assert.equal(created[0].method, "POST");
    assert.match(created[0].statusCallback, /\/voice\/twilio\/status\?callId=twilio-call-/);
    assert.equal(created[0].statusCallbackMethod, "POST");
    assert.deepEqual(created[0].statusCallbackEvent, ["initiated", "ringing", "answered", "completed"]);
});

test("voice.outboundCall twilio does not expose secrets in returned result", async () => {
    const { io } = await makeVoiceIO(twilioEnv());
    io.createTwilioClient = async () => createMockTwilioClient();

    const res = await outboundCallLogic(validParams, io);
    const serialized = JSON.stringify(res);

    assert.equal(serialized.includes("test_auth_token"), false);
    assert.equal(serialized.includes("AC_test_account"), false);
});

function createMockResponse() {
    return {
        statusCode: null,
        headers: null,
        body: "",
        writeHead(statusCode, headers = {}) {
            this.statusCode = statusCode;
            this.headers = headers;
        },
        end(body = "") {
            this.body += body;
        }
    };
}

async function callVoiceRoute(store, { method = "GET", url, body = "", headers = {}, routeOptions = {} }) {
    const handler = createTwilioVoiceRouteHandler(store, routeOptions);
    const req = new PassThrough();
    req.method = method;
    req.url = url;
    req.headers = headers;
    const res = createMockResponse();

    if (method === "POST") {
        req.end(body);
    }

    const handled = await handler(req, res);
    return { handled, res };
}

async function createSavedTwilioRecord(store, overrides = {}) {
    const record = {
        ok: true,
        dryRun: false,
        provider: "twilio",
        callId: "twilio-call-test",
        providerCallSid: "CA1234567890abcdef",
        status: "queued",
        phoneNumber: "+37060000000",
        language: "lt-LT",
        purpose: "test_call",
        message: "Twilio outbound call queued.",
        scriptPreview: validParams.script,
        responseMode: "gather",
        publicVoiceBaseUrl: "https://voice.example.test",
        metadata: {},
        transcript: [],
        answers: [],
        events: [],
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z",
        ...overrides
    };
    await store.save(record);
    return record;
}

test("Twilio TwiML route returns text/xml and includes Lithuanian intro/question", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord({ save: io.saveCall, get: io.getCall });

    const { handled, res } = await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        { url: "/voice/twilio/twiml?callId=twilio-call-test" }
    );

    assert.equal(handled, true);
    assert.equal(res.statusCode, 200);
    assert.match(res.headers["content-type"], /text\/xml/);
    assert.match(res.body, /Laba diena/);
    assert.match(res.body, /Prasome pasakyti/);
    assert.match(res.body, /<Gather/);
    assert.match(res.body, /action="https:\/\/voice\.example\.test\/voice\/twilio\/gather\?callId=twilio-call-test"/);
    assert.match(res.body, /timeout="8"/);
    assert.match(res.body, /speechTimeout="auto"/);
    assert.match(res.body, /actionOnEmptyResult="true"/);
});

test("Twilio record mode TwiML contains Record callback", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record" }
    );

    const { res } = await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        { url: "/voice/twilio/twiml?callId=twilio-call-test" }
    );

    assert.equal(res.statusCode, 200);
    assert.match(res.body, /<Say language="lt-LT">/);
    assert.match(res.body, /<Record/);
    assert.match(res.body, /action="https:\/\/voice\.example\.test\/voice\/twilio\/recording-result\?callId=twilio-call-test"/);
    assert.match(res.body, /method="POST"/);
    assert.match(res.body, /maxLength="30"/);
    assert.match(res.body, /timeout="7"/);
    assert.match(res.body, /trim="do-not-trim"/);
    assert.match(res.body, /playBeep="true"/);
    assert.match(res.body, /recordingStatusCallback="https:\/\/voice\.example\.test\/voice\/twilio\/recording-result\?callId=twilio-call-test"/);
    assert.match(res.body, /recordingStatusCallbackMethod="POST"/);
    assert.match(res.body, /recordingStatusCallbackEvent="completed"/);
});

test("Twilio record mode TwiML uses VOICE_PROMPT_AUDIO_URL when configured", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record" }
    );

    const { res } = await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        {
            url: "/voice/twilio/twiml?callId=twilio-call-test",
            routeOptions: {
                env: {
                    VOICE_PROMPT_AUDIO_URL: "https://cdn.example.test/prompts/lt-record-mode.wav",
                    VOICE_RECORD_PLAY_BEEP: "false"
                }
            }
        }
    );

    assert.equal(res.statusCode, 200);
    assert.match(res.body, /<Play>https:\/\/cdn\.example\.test\/prompts\/lt-record-mode\.wav<\/Play>/);
    assert.doesNotMatch(res.body, /<Say language="lt-LT">/);
    assert.match(res.body, /playBeep="false"/);
    assert.match(res.body, /<Record/);
});

test("Twilio gather route stores SpeechResult and Confidence", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord({ save: io.saveCall, get: io.getCall });

    const { res } = await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        {
            url: "/voice/twilio/gather?callId=twilio-call-test",
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ SpeechResult: "testas pavyko", Confidence: "0.92" }).toString()
        }
    );

    assert.equal(res.statusCode, 200);
    assert.match(res.body, /Ačiū/);

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.transcript[0].text, "testas pavyko");
    assert.equal(saved.transcript[0].confidence, 0.92);
    assert.equal(saved.answers[0].answer, "testas pavyko");
    assert.equal(saved.answers[0].confidence, 0.92);
});

test("Twilio recording-result route stores RecordingUrl and remains pending when transcription provider is none", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record" }
    );

    const { res } = await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        {
            url: "/voice/twilio/recording-result?callId=twilio-call-test",
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                RecordingSid: "RE1234567890abcdef",
                RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                RecordingDuration: "7",
                CallSid: "CA1234567890abcdef"
            }).toString()
        }
    );

    assert.equal(res.statusCode, 200);
    assert.match(res.body, /Ačiū/);

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.recordings[0].RecordingUrl, "https://api.twilio.com/recordings/RE1234567890abcdef");
    assert.equal(saved.recordings[0].RecordingSid, "RE1234567890abcdef");
    assert.equal(saved.recordings[0].RecordingDuration, "7");
    assert.equal(saved.recordings[0].CallSid, "CA1234567890abcdef");
    assert.equal(saved.transcript[0].source, "caller_recording");
    assert.equal(saved.transcript[0].recordingUrl, "https://api.twilio.com/recordings/RE1234567890abcdef");
    assert.equal(saved.transcript[0].text, null);
    assert.equal(saved.answers[0].question, validParams.script.questions[0]);
    assert.equal(saved.answers[0].answer, null);
    assert.equal(saved.answers[0].recordingSid, "RE1234567890abcdef");
    assert.equal(saved.answers[0].transcriptionPending, true);
    assert.equal(saved.answers[0].transcriptionProvider, "none");
    assert.equal(saved.answers[0].transcriptionLanguage, "lt-LT");
});

function createMockTranscriptionFetch(calls = []) {
    return async (url, options = {}) => {
        calls.push({ url, options });
        if (String(url).startsWith("https://api.twilio.com/recordings/")) {
            return new Response(new Uint8Array([1, 2, 3]), {
                status: 200,
                headers: { "content-type": "audio/wav" }
            });
        }

        if (url === "https://api.openai.com/v1/audio/transcriptions") {
            return Response.json({ text: "testas pavyko" });
        }

        return new Response("not found", { status: 404 });
    };
}

test("Twilio recording-result route transcribes Lithuanian recording with OpenAI", async () => {
    const { io } = await makeVoiceIO(twilioEnv({
        VOICE_TRANSCRIPTION_PROVIDER: "openai",
        OPENAI_API_KEY: "test_openai_key"
    }));
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record" }
    );
    const fetchCalls = [];

    const { res } = await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        {
            url: "/voice/twilio/recording-result?callId=twilio-call-test",
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            routeOptions: { env: io.env, fetch: createMockTranscriptionFetch(fetchCalls) },
            body: new URLSearchParams({
                RecordingSid: "RE1234567890abcdef",
                RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                RecordingDuration: "7",
                CallSid: "CA1234567890abcdef"
            }).toString()
        }
    );

    assert.equal(res.statusCode, 200);
    assert.equal(fetchCalls[0].url, "https://api.twilio.com/recordings/RE1234567890abcdef");
    assert.equal(
        fetchCalls[0].options.headers.Authorization,
        `Basic ${Buffer.from("AC_test_account:test_auth_token").toString("base64")}`
    );
    assert.equal(fetchCalls[1].url, "https://api.openai.com/v1/audio/transcriptions");
    assert.equal(fetchCalls[1].options.headers.Authorization, "Bearer test_openai_key");
    assert.equal(fetchCalls[1].options.body.get("language"), "lt");
    assert.equal(fetchCalls[1].options.body.get("model"), "whisper-1");

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.transcript[0].text, "testas pavyko");
    assert.equal(saved.transcript[0].transcriptionProvider, "openai");
    assert.equal(saved.transcript[0].transcriptionModel, "whisper-1");
    assert.equal(saved.transcript[0].transcriptionLanguage, "lt-LT");
    assert.equal(saved.transcript[0].transcriptionDuration, "7");
    assert.equal(saved.answers[0].answer, "testas pavyko");
    assert.equal(saved.answers[0].transcriptionPending, false);
    assert.equal(saved.answers[0].transcriptionProvider, "openai");
    assert.equal(saved.answers[0].transcriptionModel, "whisper-1");
    assert.equal(saved.answers[0].transcriptionLanguage, "lt-LT");
});

test("voice.transcribe returns disabled state and counts recordings/pending answers", async () => {
    const { io } = await makeVoiceIO({ VOICE_TRANSCRIPTION_PROVIDER: "none" });
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        {
            responseMode: "record",
            recordings: [
                {
                    RecordingSid: "RE1234567890abcdef",
                    RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef"
                }
            ],
            answers: [
                {
                    question: validParams.script.questions[0],
                    answer: null,
                    recordingSid: "RE1234567890abcdef",
                    transcriptionPending: true
                }
            ]
        }
    );

    const result = await transcribeLogic({ callId: "twilio-call-test" }, io);

    assert.deepEqual(result, {
        ok: true,
        callId: "twilio-call-test",
        provider: "none",
        language: "lt-LT",
        enabled: false,
        message: "Transcription provider is disabled/not configured.",
        recordingsFound: 1,
        transcriptionPendingAnswersFound: 1
    });
});

test("voice.transcribe updates pending answer with mocked OpenAI transcription", async () => {
    const { io } = await makeVoiceIO(twilioEnv({
        VOICE_TRANSCRIPTION_PROVIDER: "openai",
        OPENAI_API_KEY: "test_openai_key"
    }));
    io.fetch = createMockTranscriptionFetch([]);
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        {
            responseMode: "record",
            transcript: [
                {
                    source: "caller_recording",
                    recordingSid: "RE1234567890abcdef",
                    recordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                    duration: "7",
                    text: null,
                    createdAt: "2026-05-18T10:00:00.000Z"
                }
            ],
            answers: [
                {
                    question: validParams.script.questions[0],
                    answer: null,
                    recordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                    recordingSid: "RE1234567890abcdef",
                    transcriptionPending: true
                }
            ],
            recordings: [
                {
                    RecordingSid: "RE1234567890abcdef",
                    RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                    RecordingDuration: "7",
                    CallSid: "CA1234567890abcdef"
                }
            ]
        }
    );

    const result = await transcribeLogic({ callId: "twilio-call-test" }, io);

    assert.equal(result.ok, true);
    assert.equal(result.provider, "openai");
    assert.equal(result.status, "transcribed");
    assert.equal(result.text, "testas pavyko");
    assert.equal(result.transcriptionPendingAnswersFound, 0);

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.transcript[0].text, "testas pavyko");
    assert.equal(saved.answers[0].answer, "testas pavyko");
    assert.equal(saved.answers[0].transcriptionPending, false);
});

test("voice.transcribe returns clear errors for missing RecordingUrl and OpenAI config", async () => {
    const { io } = await makeVoiceIO(twilioEnv({ VOICE_TRANSCRIPTION_PROVIDER: "openai" }));
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        {
            responseMode: "record",
            recordings: [{ RecordingSid: "RE1234567890abcdef" }],
            answers: [{ recordingSid: "RE1234567890abcdef", transcriptionPending: true }]
        }
    );

    const missingUrl = await transcribeLogic({ callId: "twilio-call-test" }, io);
    assert.equal(missingUrl.ok, false);
    assert.equal(missingUrl.status, "missing_recording_url");
    assert.equal(missingUrl.message, "RecordingUrl is required before transcription can run.");

    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        {
            responseMode: "record",
            recordings: [
                {
                    RecordingSid: "RE1234567890abcdef",
                    RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef"
                }
            ],
            answers: [{ recordingSid: "RE1234567890abcdef", transcriptionPending: true }]
        }
    );

    const missingConfig = await transcribeLogic({ callId: "twilio-call-test" }, io);
    assert.equal(missingConfig.ok, false);
    assert.equal(missingConfig.status, "not_configured");
    assert.equal(missingConfig.message, "OPENAI_API_KEY is required when VOICE_TRANSCRIPTION_PROVIDER=openai.");
});

test("Twilio status route stores CallStatus event", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord({ save: io.saveCall, get: io.getCall });

    const { res } = await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        {
            url: "/voice/twilio/status?callId=twilio-call-test",
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                CallSid: "CA1234567890abcdef",
                CallStatus: "completed",
                CallDuration: "12",
                Direction: "outbound-api",
                From: "+15551234567",
                To: "+37060000000",
                Timestamp: "Mon, 18 May 2026 10:00:00 +0000"
            }).toString()
        }
    );

    assert.equal(res.statusCode, 204);

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.status, "completed");
    assert.equal(saved.events[0].CallStatus, "completed");
    assert.equal(saved.events[0].CallSid, "CA1234567890abcdef");
});

test("Twilio completed status callback updates final status after recording callback", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record", status: "in-progress" }
    );

    await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        {
            url: "/voice/twilio/recording-result?callId=twilio-call-test",
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                RecordingSid: "RE1234567890abcdef",
                RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                RecordingDuration: "7",
                CallSid: "CA1234567890abcdef"
            }).toString()
        }
    );

    let saved = await io.getCall("twilio-call-test");
    assert.equal(saved.status, "in-progress");
    assert.equal(saved.recordings[0].RecordingSid, "RE1234567890abcdef");

    await callVoiceRoute(
        { save: io.saveCall, get: io.getCall },
        {
            url: "/voice/twilio/status?callId=twilio-call-test",
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                CallSid: "CA1234567890abcdef",
                CallStatus: "completed",
                CallDuration: "12"
            }).toString()
        }
    );

    saved = await io.getCall("twilio-call-test");
    assert.equal(saved.status, "completed");
    assert.equal(saved.recordings[0].RecordingSid, "RE1234567890abcdef");
    assert.equal(saved.events[0].CallStatus, "completed");
});

test("voice.getCallStatus and voice.getCallResult work for twilio records", async () => {
    const { io } = await makeVoiceIO();
    const record = await createSavedTwilioRecord({ save: io.saveCall, get: io.getCall });

    const status = await getCallStatusLogic({ callId: record.callId }, io);
    assert.deepEqual(status, {
        ok: true,
        callId: "twilio-call-test",
        provider: "twilio",
        providerCallSid: "CA1234567890abcdef",
        status: "queued",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
    });

    const result = await getCallResultLogic({ callId: record.callId }, io);
    assert.deepEqual(result, {
        ok: true,
        callId: "twilio-call-test",
        provider: "twilio",
        providerCallSid: "CA1234567890abcdef",
        status: "queued",
        transcript: [],
        answers: [],
        recordings: [],
        summary: "Twilio call result available; no speech captured yet."
    });
});

test("Twilio recording-result deduplication: second callback with same RecordingSid is idempotent", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record" }
    );

    const store = { save: io.saveCall, get: io.getCall };
    const routeParams = {
        url: "/voice/twilio/recording-result?callId=twilio-call-test",
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            RecordingSid: "RE1234567890abcdef",
            RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
            RecordingDuration: "7",
            CallSid: "CA1234567890abcdef"
        }).toString()
    };

    await callVoiceRoute(store, routeParams);
    await callVoiceRoute(store, routeParams);

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.recordings.length, 1, "recordings should not be duplicated");
    assert.equal(saved.transcript.length, 1, "transcript should not be duplicated");
    assert.equal(saved.answers.length, 1, "answers should not be duplicated");
});

test("Twilio completed status is not downgraded by a subsequent in-progress status callback", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { status: "completed" }
    );

    const store = { save: io.saveCall, get: io.getCall };
    await callVoiceRoute(store, {
        url: "/voice/twilio/status?callId=twilio-call-test",
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            CallSid: "CA1234567890abcdef",
            CallStatus: "in-progress"
        }).toString()
    });

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.status, "completed");
});

test("Twilio status remains completed when late recording-result callback arrives", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record", status: "completed" }
    );

    const store = { save: io.saveCall, get: io.getCall };
    await callVoiceRoute(store, {
        url: "/voice/twilio/recording-result?callId=twilio-call-test",
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            RecordingSid: "RE1234567890abcdef",
            RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
            RecordingDuration: "7",
            CallSid: "CA1234567890abcdef"
        }).toString()
    });

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.status, "completed");
    assert.equal(saved.recordings.length, 1);
});

function createMockInterpretationFetch(transcriptText, interpretationPayload) {
    return async (url, _opts) => {
        if (String(url).startsWith("https://api.twilio.com/recordings/")) {
            return new Response(new Uint8Array([1, 2, 3]), {
                status: 200,
                headers: { "content-type": "audio/wav" }
            });
        }
        if (url === "https://api.openai.com/v1/audio/transcriptions") {
            return Response.json({ text: transcriptText });
        }
        if (url === "https://api.openai.com/v1/chat/completions") {
            return Response.json({
                choices: [{ message: { content: JSON.stringify(interpretationPayload) } }]
            });
        }
        return new Response("not found", { status: 404 });
    };
}

test("Twilio recording-result attaches LLM interpretation to answer when provider=openai", async () => {
    const env = twilioEnv({
        VOICE_TRANSCRIPTION_PROVIDER: "openai",
        OPENAI_API_KEY: "test_openai_key",
        VOICE_ANSWER_INTERPRETER_PROVIDER: "openai"
    });
    const { io } = await makeVoiceIO(env);
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record" }
    );

    const interpretationPayload = {
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

    const store = { save: io.saveCall, get: io.getCall };
    await callVoiceRoute(store, {
        url: "/voice/twilio/recording-result?callId=twilio-call-test",
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        routeOptions: {
            env,
            fetch: createMockInterpretationFetch("Taip, turiu priekinį kairės pusės žibintą", interpretationPayload)
        },
        body: new URLSearchParams({
            RecordingSid: "RE1234567890abcdef",
            RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
            RecordingDuration: "7",
            CallSid: "CA1234567890abcdef"
        }).toString()
    });

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.transcript[0].text, "Taip, turiu priekinį kairės pusės žibintą");
    assert.equal(saved.answers[0].answer, "Taip, turiu priekinį kairės pusės žibintą");
    assert.equal(saved.answers[0].interpretation.intent, "has_part");
    assert.equal(saved.answers[0].interpretation.availability, "yes");
    assert.equal(saved.answers[0].interpretation.mentionedSide, "left");
    assert.equal(saved.answers[0].interpretation.sideMatched, true);
    assert.equal(saved.answers[0].interpretation.confidence, 0.95);
    assert.ok(saved.answers[0].interpretedAt);
});

test("Twilio recording-result does not attach interpretation when interpreter is disabled", async () => {
    const env = twilioEnv({
        VOICE_TRANSCRIPTION_PROVIDER: "openai",
        OPENAI_API_KEY: "test_openai_key"
        // VOICE_ANSWER_INTERPRETER_PROVIDER not set → defaults to none
    });
    const { io } = await makeVoiceIO(env);
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        { responseMode: "record" }
    );

    const store = { save: io.saveCall, get: io.getCall };
    await callVoiceRoute(store, {
        url: "/voice/twilio/recording-result?callId=twilio-call-test",
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        routeOptions: {
            env,
            fetch: createMockTranscriptionFetch([])
        },
        body: new URLSearchParams({
            RecordingSid: "RE1234567890abcdef",
            RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
            RecordingDuration: "7",
            CallSid: "CA1234567890abcdef"
        }).toString()
    });

    const saved = await io.getCall("twilio-call-test");
    assert.equal(saved.answers[0].answer, "testas pavyko");
    assert.equal(saved.answers[0].interpretation, undefined);
    assert.equal(saved.answers[0].interpretedAt, undefined);
});

test("voice.getCallResult returns recording info for twilio records", async () => {
    const { io } = await makeVoiceIO();
    await createSavedTwilioRecord(
        { save: io.saveCall, get: io.getCall },
        {
            responseMode: "record",
            transcript: [
                {
                    source: "caller_recording",
                    recordingSid: "RE1234567890abcdef",
                    recordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                    duration: "7",
                    text: null,
                    createdAt: "2026-05-18T10:00:00.000Z"
                }
            ],
            answers: [
                {
                    question: validParams.script.questions[0],
                    answer: null,
                    recordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                    recordingSid: "RE1234567890abcdef",
                    transcriptionPending: true
                }
            ],
            recordings: [
                {
                    RecordingSid: "RE1234567890abcdef",
                    RecordingUrl: "https://api.twilio.com/recordings/RE1234567890abcdef",
                    RecordingDuration: "7",
                    CallSid: "CA1234567890abcdef",
                    timestamp: "2026-05-18T10:00:00.000Z"
                }
            ]
        }
    );

    const result = await getCallResultLogic({ callId: "twilio-call-test" }, io);

    assert.equal(result.transcript[0].recordingSid, "RE1234567890abcdef");
    assert.equal(result.answers[0].transcriptionPending, true);
    assert.equal(result.recordings[0].RecordingUrl, "https://api.twilio.com/recordings/RE1234567890abcdef");
});
