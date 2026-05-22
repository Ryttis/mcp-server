import { randomUUID } from "crypto";
import { ToolError } from "../../errors/ToolError.js";

const CALLBACK_EVENTS = ["initiated", "ringing", "answered", "completed"];

function requireEnv(env, names) {
    const missing = names.filter((name) => !env[name]);
    if (missing.length > 0) {
        throw new ToolError("MISSING_TWILIO_CONFIG", "Required Twilio environment variables are missing.", { missing });
    }
}

function stripTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
}

function previewScript(script) {
    return {
        intro: script.intro,
        questions: script.questions,
        closing: script.closing
    };
}

async function defaultCreateTwilioClient(env) {
    const { default: twilio } = await import("twilio");
    return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

export async function createTwilioOutboundCall(params, io) {
    const env = io.env || {};

    if (env.VOICE_CALLS_ENABLED !== "true") {
        throw new ToolError("CALLS_DISABLED", "VOICE_CALLS_ENABLED must be true for Twilio calls.");
    }

    requireEnv(env, [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_FROM_NUMBER",
        "PUBLIC_VOICE_BASE_URL"
    ]);

    const createdAt = new Date().toISOString();
    const callId = `twilio-call-${randomUUID()}`;
    const baseUrl = stripTrailingSlash(env.PUBLIC_VOICE_BASE_URL);
    const twimlUrl = `${baseUrl}/voice/twilio/twiml?callId=${encodeURIComponent(callId)}`;
    const statusCallback = `${baseUrl}/voice/twilio/status?callId=${encodeURIComponent(callId)}`;
    const metadata = params.metadata && typeof params.metadata === "object" ? params.metadata : {};
    const responseMode = params.responseMode || "gather";

    const initialRecord = {
        ok: true,
        dryRun: false,
        provider: "twilio",
        callId,
        status: "creating",
        phoneNumber: params.phoneNumber,
        language: params.language,
        purpose: params.purpose ?? null,
        message: "Twilio outbound call is being created.",
        scriptPreview: previewScript(params.script),
        responseMode,
        publicVoiceBaseUrl: baseUrl,
        gatherSpeech: params.gatherSpeech === true,
        record: params.record === true,
        metadata,
        transcript: [],
        answers: [],
        events: [],
        warnings: params.warnings || [],
        createdAt,
        updatedAt: createdAt
    };

    await io.saveCall(initialRecord);

    const createTwilioClient = io.createTwilioClient || defaultCreateTwilioClient;
    const client = await createTwilioClient(env);
    const providerCall = await client.calls.create({
        to: params.phoneNumber,
        from: env.TWILIO_FROM_NUMBER,
        url: twimlUrl,
        method: "POST",
        statusCallback,
        statusCallbackMethod: "POST",
        statusCallbackEvent: CALLBACK_EVENTS
    });

    const updatedAt = new Date().toISOString();
    const record = {
        ...initialRecord,
        providerCallSid: providerCall.sid,
        status: providerCall.status || "queued",
        message: "Twilio outbound call queued.",
        updatedAt
    };

    await io.saveCall(record);

    return {
        ok: true,
        dryRun: false,
        provider: "twilio",
        callId,
        providerCallSid: record.providerCallSid,
        status: record.status,
        phoneNumber: record.phoneNumber,
        language: record.language,
        purpose: record.purpose,
        message: record.message,
        scriptPreview: record.scriptPreview,
        responseMode: record.responseMode,
        metadata: record.metadata,
        createdAt: record.createdAt,
        warnings: record.warnings
    };
}

export function twilioCallResult(record) {
    const transcript = Array.isArray(record.transcript) ? record.transcript : [];
    const answers = Array.isArray(record.answers) ? record.answers : [];
    const recordings = Array.isArray(record.recordings) ? record.recordings : [];

    return {
        ok: true,
        callId: record.callId,
        provider: "twilio",
        providerCallSid: record.providerCallSid,
        status: record.status,
        transcript,
        answers,
        recordings,
        summary: transcript.length > 0
            ? "Twilio call completed with captured speech."
            : "Twilio call result available; no speech captured yet."
    };
}
