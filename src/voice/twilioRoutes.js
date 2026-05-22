import { callStore } from "./callStore.js";
import {
    applyTranscriptionToRecord,
    createTranscriptionProvider,
    updatePendingTranscriptionInRecord
} from "./transcriptionProvider.js";
import { createAnswerInterpreter } from "./answerInterpreter.js";
import { createGatherThanksTwiml, createOutboundCallTwiml, createSafeTwiml } from "./twiml.js";

const MAX_BODY_BYTES = 1024 * 128;

const TERMINAL_STATUSES = new Set(["completed", "failed", "busy", "no-answer", "canceled"]);

function mergeCallStatus(existing, incoming) {
    if (existing && TERMINAL_STATUSES.has(existing)) return existing;
    return incoming || existing;
}

function send(res, statusCode, body, headers = {}) {
    res.writeHead(statusCode, headers);
    res.end(body);
}

function sendTwiml(res, body) {
    send(res, 200, body, { "content-type": "text/xml; charset=utf-8" });
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.setEncoding("utf8");
        req.on("data", (chunk) => {
            body += chunk;
            if (body.length > MAX_BODY_BYTES) {
                reject(new Error("Request body too large"));
                req.destroy();
            }
        });
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

function parseBody(raw, contentType = "") {
    if (!raw) return {};
    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }

    return Object.fromEntries(new URLSearchParams(raw));
}

async function requestParams(req, url) {
    const body = req.method === "POST"
        ? parseBody(await readBody(req), req.headers["content-type"] || "")
        : {};
    return {
        ...Object.fromEntries(url.searchParams),
        ...body
    };
}

function numericOrNull(value) {
    if (value === undefined || value === null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

async function getRecord(store, callId) {
    if (!callId) return null;
    try {
        return await store.get(callId);
    } catch {
        return null;
    }
}

async function handleTwiml(store, req, res, url) {
    const params = await requestParams(req, url);
    const record = await getRecord(store, params.callId);
    if (!record) {
        sendTwiml(res, createSafeTwiml());
        return true;
    }

    sendTwiml(res, createOutboundCallTwiml(record, { env: store.env || process.env }));
    return true;
}

async function handleGather(store, req, res, url) {
    const params = await requestParams(req, url);
    const record = await getRecord(store, params.callId);
    if (!record) {
        sendTwiml(res, createSafeTwiml());
        return true;
    }

    const speechResult = typeof params.SpeechResult === "string" ? params.SpeechResult : "";
    const confidence = numericOrNull(params.Confidence);
    const createdAt = new Date().toISOString();
    const question = Array.isArray(record.scriptPreview?.questions)
        ? record.scriptPreview.questions[0]
        : null;

    const transcript = Array.isArray(record.transcript) ? record.transcript : [];
    const answers = Array.isArray(record.answers) ? record.answers : [];
    const updated = {
        ...record,
        transcript: [
            ...transcript,
            {
                source: "caller",
                text: speechResult,
                confidence,
                createdAt
            }
        ],
        answers: [
            ...answers,
            {
                question,
                answer: speechResult,
                confidence
            }
        ],
        status: record.status || "answered",
        updatedAt: createdAt
    };

    await store.save(updated);
    sendTwiml(res, createGatherThanksTwiml());
    return true;
}

async function applyInterpretationToAnswers(record, interpreter, recording, createdAt) {
    if (!interpreter?.enabled) return record;
    const answers = Array.isArray(record.answers) ? record.answers : [];

    const updated = await Promise.all(answers.map(async (answer) => {
        if (!answer) return answer;
        if (answer.recordingSid !== recording.RecordingSid) return answer;
        if (answer.interpretation !== undefined || answer.interpretationError !== undefined) return answer;
        const text = typeof answer.answer === "string" ? answer.answer.trim() : "";
        if (!text) return answer;

        let result;
        try {
            result = await interpreter.interpretAnswer({
                text,
                question: typeof answer.question === "string" ? answer.question : undefined,
                callId: record.callId,
                recordingSid: recording.RecordingSid
            });
        } catch (err) {
            return { ...answer, interpretationError: err?.message || "interpretation failed" };
        }

        if (!result || result.disabled || result.skipped) return answer;
        if (result.interpretationError) {
            return { ...answer, interpretationError: result.interpretationError };
        }
        const { disabled, skipped, ...interpretation } = result;
        return { ...answer, interpretation, interpretedAt: createdAt };
    }));

    return { ...record, answers: updated };
}

async function handleRecordingResult(store, transcriptionProvider, interpreter, req, res, url) {
    const params = await requestParams(req, url);
    const record = await getRecord(store, params.callId);
    if (!record) {
        sendTwiml(res, createSafeTwiml());
        return true;
    }

    const createdAt = new Date().toISOString();
    const recordings = Array.isArray(record.recordings) ? record.recordings : [];

    // Deduplicate by RecordingSid on initial fetch
    const hasRecording = params.RecordingSid
        && recordings.some((item) => item?.RecordingSid === params.RecordingSid);

    if (hasRecording) {
        sendTwiml(res, createGatherThanksTwiml());
        return true;
    }

    const recording = {
        RecordingSid: params.RecordingSid,
        RecordingUrl: params.RecordingUrl,
        RecordingDuration: params.RecordingDuration,
        CallSid: params.CallSid,
        timestamp: createdAt
    };

    const transcription = await transcriptionProvider.transcribeRecording({ record, recording });

    // Re-fetch to get the latest status and recordings after async transcription
    const latestRecord = await getRecord(store, params.callId) || record;
    const latestRecordings = Array.isArray(latestRecord.recordings) ? latestRecord.recordings : [];

    // Re-check for duplicate after re-fetch (guards concurrent callbacks for same RecordingSid)
    const latestHasRecording = params.RecordingSid
        && latestRecordings.some((item) => item?.RecordingSid === params.RecordingSid);

    if (latestHasRecording) {
        // Merge transcription text into pending entries if we have it and they're still pending
        if (transcription.ok && transcription.text) {
            const merged = updatePendingTranscriptionInRecord(latestRecord, recording, transcription, createdAt);
            await store.save(merged);
        }
        sendTwiml(res, createGatherThanksTwiml());
        return true;
    }

    const baseRecord = {
        ...latestRecord,
        recordings: [...latestRecordings, recording],
        events: Array.isArray(latestRecord.events) ? latestRecord.events : [],
        status: mergeCallStatus(latestRecord.status, latestRecord.status || "answered")
    };

    const updatedRecord = applyTranscriptionToRecord(baseRecord, recording, transcription, createdAt);
    const withInterpretation = await applyInterpretationToAnswers(updatedRecord, interpreter, recording, createdAt);

    await store.save(withInterpretation);
    sendTwiml(res, createGatherThanksTwiml());
    return true;
}

async function handleStatus(store, req, res, url) {
    const params = await requestParams(req, url);
    const record = await getRecord(store, params.callId);
    if (!record) {
        send(res, 204, "");
        return true;
    }

    const createdAt = new Date().toISOString();
    const safeEvent = {
        CallSid: params.CallSid,
        CallStatus: params.CallStatus,
        CallDuration: params.CallDuration,
        Direction: params.Direction,
        From: params.From,
        To: params.To,
        Timestamp: params.Timestamp,
        createdAt
    };
    const events = Array.isArray(record.events) ? record.events : [];

    await store.save({
        ...record,
        // Terminal statuses (completed/failed/busy/no-answer/canceled) cannot be downgraded
        status: mergeCallStatus(record.status, params.CallStatus || record.status),
        events: [...events, safeEvent],
        updatedAt: createdAt
    });

    send(res, 204, "");
    return true;
}

export function createTwilioVoiceRouteHandler(store = callStore, options = {}) {
    const routeStore = { ...store, env: options.env || store.env };
    const transcriptionProvider = options.transcriptionProvider || createTranscriptionProvider(options.env, {
        fetch: options.fetch
    });
    const interpreter = options.answerInterpreter !== undefined
        ? options.answerInterpreter
        : createAnswerInterpreter(options.env || process.env, { fetch: options.fetch });

    return async function handleTwilioVoiceRoute(req, res) {
        const url = new URL(req.url, "http://localhost");
        if (url.pathname === "/voice/twilio/twiml" && (req.method === "GET" || req.method === "POST")) {
            return handleTwiml(routeStore, req, res, url);
        }

        if (url.pathname === "/voice/twilio/gather" && req.method === "POST") {
            return handleGather(routeStore, req, res, url);
        }

        if (url.pathname === "/voice/twilio/recording-result" && req.method === "POST") {
            return handleRecordingResult(routeStore, transcriptionProvider, interpreter, req, res, url);
        }

        if (url.pathname === "/voice/twilio/status" && req.method === "POST") {
            return handleStatus(routeStore, req, res, url);
        }

        return false;
    };
}

export const handleTwilioVoiceRoute = createTwilioVoiceRouteHandler();
