const SUPPORTED_PROVIDERS = new Set(["none", "google", "openai"]);
const DEFAULT_PROVIDER = "none";
const DEFAULT_LANGUAGE = "lt-LT";
const DEFAULT_OPENAI_TRANSCRIPTION_MODEL = "whisper-1";
const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";

export function normalizeTranscriptionProvider(value) {
    const provider = String(value || DEFAULT_PROVIDER).trim().toLowerCase();
    if (!SUPPORTED_PROVIDERS.has(provider)) {
        throw new Error("VOICE_TRANSCRIPTION_PROVIDER must be one of: none, google, openai");
    }
    return provider;
}

export function getTranscriptionConfig(env = process.env) {
    return {
        provider: normalizeTranscriptionProvider(env.VOICE_TRANSCRIPTION_PROVIDER),
        language: env.VOICE_TRANSCRIPTION_LANGUAGE || DEFAULT_LANGUAGE,
        openaiApiKey: env.OPENAI_API_KEY || "",
        openaiModel: env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_OPENAI_TRANSCRIPTION_MODEL,
        twilioAccountSid: env.TWILIO_ACCOUNT_SID || "",
        twilioAuthToken: env.TWILIO_AUTH_TOKEN || ""
    };
}

function openAiLanguage(language) {
    return String(language || DEFAULT_LANGUAGE).split("-")[0].toLowerCase();
}

function basicAuth(username, password) {
    return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function filenameForRecording(recording = {}) {
    const sid = recording.RecordingSid || "twilio-recording";
    return `${sid}.wav`;
}

async function responseBodySnippet(response) {
    try {
        const text = await response.text();
        return text ? ` ${text.slice(0, 300)}` : "";
    } catch {
        return "";
    }
}

async function fetchTwilioRecordingAudio({ recording, config, fetchImpl }) {
    if (!recording?.RecordingUrl) {
        return {
            ok: false,
            status: "missing_recording_url",
            message: "RecordingUrl is required before transcription can run.",
            audio: null,
            contentType: null
        };
    }

    if (!config.twilioAccountSid || !config.twilioAuthToken) {
        return {
            ok: false,
            status: "not_configured",
            message: "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required to fetch Twilio recording audio.",
            audio: null,
            contentType: null
        };
    }

    const response = await fetchImpl(recording.RecordingUrl, {
        headers: {
            Authorization: basicAuth(config.twilioAccountSid, config.twilioAuthToken)
        }
    });

    if (!response.ok) {
        return {
            ok: false,
            status: "twilio_fetch_failed",
            message: `Twilio recording fetch failed with HTTP ${response.status}.${await responseBodySnippet(response)}`,
            audio: null,
            contentType: null
        };
    }

    return {
        ok: true,
        status: "audio_fetched",
        message: "Twilio recording audio fetched.",
        audio: await response.arrayBuffer(),
        contentType: response.headers?.get?.("content-type") || "audio/wav"
    };
}

async function transcribeWithOpenAI({ recording, config, fetchImpl }) {
    if (!config.openaiApiKey) {
        return {
            ok: false,
            provider: "openai",
            model: config.openaiModel,
            language: config.language,
            duration: recording?.RecordingDuration || null,
            status: "not_configured",
            message: "OPENAI_API_KEY is required when VOICE_TRANSCRIPTION_PROVIDER=openai.",
            text: null,
            transcriptionPending: true
        };
    }

    const audioResult = await fetchTwilioRecordingAudio({ recording, config, fetchImpl });
    if (!audioResult.ok) {
        return {
            ok: false,
            provider: "openai",
            model: config.openaiModel,
            language: config.language,
            duration: recording?.RecordingDuration || null,
            status: audioResult.status,
            message: audioResult.message,
            text: null,
            transcriptionPending: true
        };
    }

    const form = new FormData();
    const file = new Blob([audioResult.audio], { type: audioResult.contentType || "audio/wav" });
    form.append("file", file, filenameForRecording(recording));
    form.append("model", config.openaiModel);
    form.append("language", openAiLanguage(config.language));
    form.append("response_format", "json");

    const response = await fetchImpl(OPENAI_TRANSCRIPTIONS_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.openaiApiKey}`
        },
        body: form
    });

    if (!response.ok) {
        return {
            ok: false,
            provider: "openai",
            model: config.openaiModel,
            language: config.language,
            duration: recording?.RecordingDuration || null,
            status: "openai_transcription_failed",
            message: `OpenAI transcription failed with HTTP ${response.status}.${await responseBodySnippet(response)}`,
            text: null,
            transcriptionPending: true
        };
    }

    const data = await response.json();
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    const hasText = text.length > 0;
    const metadata = { ...data };
    delete metadata.text;
    return {
        ok: hasText,
        provider: "openai",
        model: config.openaiModel,
        language: config.language,
        duration: recording?.RecordingDuration || data?.duration || null,
        confidence: typeof data?.confidence === "number" ? data.confidence : null,
        metadata,
        status: hasText ? "transcribed" : "empty_transcription",
        message: hasText ? "Recording transcribed with OpenAI." : "OpenAI returned an empty transcription.",
        text,
        transcriptionPending: !hasText
    };
}

export function createTranscriptionProvider(env = process.env, options = {}) {
    const config = getTranscriptionConfig(env);
    const fetchImpl = options.fetch || globalThis.fetch;

    return {
        name: config.provider,
        language: config.language,
        enabled: config.provider !== "none",

        async transcribeRecording(input = {}) {
            if (config.provider === "none") {
                return {
                    ok: false,
                    provider: config.provider,
                    model: config.provider === "openai" ? config.openaiModel : null,
                    language: config.language,
                    duration: input.recording?.RecordingDuration || null,
                    status: "disabled",
                    message: "Transcription provider is disabled.",
                    text: null,
                    transcriptionPending: true
                };
            }

            if (!fetchImpl) {
                return {
                    ok: false,
                    provider: config.provider,
                    model: config.provider === "openai" ? config.openaiModel : null,
                    language: config.language,
                    duration: input.recording?.RecordingDuration || null,
                    status: "not_configured",
                    message: "A fetch implementation is required for transcription.",
                    text: null,
                    transcriptionPending: true
                };
            }

            if (config.provider === "openai") {
                return transcribeWithOpenAI({ recording: input.recording, config, fetchImpl });
            }

            return {
                ok: false,
                provider: config.provider,
                model: config.provider === "openai" ? config.openaiModel : null,
                language: config.language,
                duration: input.recording?.RecordingDuration || null,
                status: "not_configured",
                message: `${config.provider} transcription is not implemented yet.`,
                text: null,
                transcriptionPending: true
            };
        }
    };
}

function sameRecording(left = {}, right = {}) {
    return Boolean(
        (left.recordingSid && right.RecordingSid && left.recordingSid === right.RecordingSid)
        || (left.recordingUrl && right.RecordingUrl && left.recordingUrl === right.RecordingUrl)
    );
}

export function applyTranscriptionToRecord(record = {}, recording = {}, transcription = {}, createdAt = new Date().toISOString()) {
    const question = Array.isArray(record.scriptPreview?.questions)
        ? record.scriptPreview.questions[0]
        : null;
    const transcript = Array.isArray(record.transcript) ? record.transcript : [];
    const answers = Array.isArray(record.answers) ? record.answers : [];
    const transcriptionPending = transcription.transcriptionPending !== false;
    const transcriptionText = typeof transcription.text === "string" ? transcription.text : null;
    const transcriptionMetadata = transcription.provider
        ? {
            transcriptionProvider: transcription.provider,
            transcriptionModel: transcription.model || null,
            transcriptionLanguage: transcription.language || null,
            transcriptionDuration: transcription.duration || recording.RecordingDuration || null,
            transcriptionConfidence: transcription.confidence ?? null,
            transcriptionStatus: transcription.status,
            transcriptionMessage: transcription.message,
            transcriptionMetadata: transcription.metadata || null
        }
        : {};

    return {
        ...record,
        transcript: [
            ...transcript,
            {
                source: "caller_recording",
                recordingSid: recording.RecordingSid,
                recordingUrl: recording.RecordingUrl,
                duration: recording.RecordingDuration,
                RecordingUrl: recording.RecordingUrl,
                text: transcriptionText,
                ...transcriptionMetadata,
                createdAt
            }
        ],
        answers: [
            ...answers,
            {
                question,
                answer: transcriptionText,
                recordingUrl: recording.RecordingUrl,
                recordingSid: recording.RecordingSid,
                RecordingUrl: recording.RecordingUrl,
                transcriptionPending,
                ...transcriptionMetadata
            }
        ],
        status: record.status || "answered",
        updatedAt: createdAt
    };
}

export function updatePendingTranscriptionInRecord(record = {}, recording = {}, transcription = {}, createdAt = new Date().toISOString()) {
    const transcript = Array.isArray(record.transcript) ? record.transcript : [];
    const answers = Array.isArray(record.answers) ? record.answers : [];
    const appended = applyTranscriptionToRecord(record, recording, transcription, createdAt);
    const transcriptionText = typeof transcription.text === "string" ? transcription.text : null;
    const transcriptionPending = transcription.transcriptionPending !== false;
    let transcriptUpdated = false;
    let answerUpdated = false;

    const nextTranscript = transcript.map((item) => {
        if (item?.source === "caller_recording" && sameRecording(item, recording)) {
            transcriptUpdated = true;
            return {
                ...item,
                text: transcriptionText,
                transcriptionProvider: transcription.provider,
                transcriptionModel: transcription.model || null,
                transcriptionLanguage: transcription.language || null,
                transcriptionDuration: transcription.duration || recording.RecordingDuration || null,
                transcriptionConfidence: transcription.confidence ?? null,
                transcriptionStatus: transcription.status,
                transcriptionMessage: transcription.message,
                transcriptionMetadata: transcription.metadata || null,
                transcribedAt: createdAt
            };
        }
        return item;
    });

    const nextAnswers = answers.map((answer) => {
        if (answer?.transcriptionPending === true && sameRecording(answer, recording)) {
            answerUpdated = true;
            return {
                ...answer,
                answer: transcriptionText,
                transcriptionPending,
                transcriptionProvider: transcription.provider,
                transcriptionModel: transcription.model || null,
                transcriptionLanguage: transcription.language || null,
                transcriptionDuration: transcription.duration || recording.RecordingDuration || null,
                transcriptionConfidence: transcription.confidence ?? null,
                transcriptionStatus: transcription.status,
                transcriptionMessage: transcription.message,
                transcriptionMetadata: transcription.metadata || null,
                transcribedAt: createdAt
            };
        }
        return answer;
    });

    return {
        ...record,
        transcript: transcriptUpdated
            ? nextTranscript
            : appended.transcript,
        answers: answerUpdated
            ? nextAnswers
            : appended.answers,
        updatedAt: createdAt
    };
}

export function summarizeTranscriptionState(record = {}, env = process.env) {
    const config = getTranscriptionConfig(env);
    const recordings = Array.isArray(record.recordings) ? record.recordings : [];
    const answers = Array.isArray(record.answers) ? record.answers : [];
    const pendingAnswers = answers.filter((answer) => answer?.transcriptionPending === true);

    return {
        ok: true,
        callId: record.callId,
        provider: config.provider,
        language: config.language,
        enabled: config.provider !== "none",
        message: config.provider === "none"
            ? "Transcription provider is disabled/not configured."
            : `${config.provider} transcription is not implemented yet.`,
        recordingsFound: recordings.length,
        transcriptionPendingAnswersFound: pendingAnswers.length
    };
}
