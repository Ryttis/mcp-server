import { callStore } from "./callStore.js";
import { applyTranscriptionToRecord, createTranscriptionProvider } from "./transcriptionProvider.js";
import { createGatherThanksTwiml, createOutboundCallTwiml, createSafeTwiml } from "./twiml.js";

const MAX_BODY_BYTES = 1024 * 128;

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

async function handleRecordingResult(store, transcriptionProvider, req, res, url) {
    const params = await requestParams(req, url);
    const record = await getRecord(store, params.callId);
    if (!record) {
        sendTwiml(res, createSafeTwiml());
        return true;
    }

    const createdAt = new Date().toISOString();
    const recording = {
        RecordingSid: params.RecordingSid,
        RecordingUrl: params.RecordingUrl,
        RecordingDuration: params.RecordingDuration,
        CallSid: params.CallSid,
        timestamp: createdAt
    };
    const recordings = Array.isArray(record.recordings) ? record.recordings : [];
    const hasRecording = params.RecordingSid
        && recordings.some((item) => item?.RecordingSid === params.RecordingSid);

    if (hasRecording) {
        sendTwiml(res, createGatherThanksTwiml());
        return true;
    }

    const transcription = await transcriptionProvider.transcribeRecording({ record, recording });
    const latestRecord = await getRecord(store, params.callId) || record;
    const latestRecordings = Array.isArray(latestRecord.recordings) ? latestRecord.recordings : recordings;
    const updatedRecord = applyTranscriptionToRecord({
        ...latestRecord,
        recordings: [...latestRecordings, recording],
        events: Array.isArray(latestRecord.events) ? latestRecord.events : [],
        status: latestRecord.status || "answered"
    }, recording, transcription, createdAt);

    await store.save(updatedRecord);

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
        status: params.CallStatus || record.status,
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

    return async function handleTwilioVoiceRoute(req, res) {
        const url = new URL(req.url, "http://localhost");
        if (url.pathname === "/voice/twilio/twiml" && (req.method === "GET" || req.method === "POST")) {
            return handleTwiml(routeStore, req, res, url);
        }

        if (url.pathname === "/voice/twilio/gather" && req.method === "POST") {
            return handleGather(routeStore, req, res, url);
        }

        if (url.pathname === "/voice/twilio/recording-result" && req.method === "POST") {
            return handleRecordingResult(routeStore, transcriptionProvider, req, res, url);
        }

        if (url.pathname === "/voice/twilio/status" && req.method === "POST") {
            return handleStatus(routeStore, req, res, url);
        }

        return false;
    };
}

export const handleTwilioVoiceRoute = createTwilioVoiceRouteHandler();
