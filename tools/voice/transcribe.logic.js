import { ToolError } from "../../errors/ToolError.js";
import {
    createTranscriptionProvider,
    summarizeTranscriptionState,
    updatePendingTranscriptionInRecord
} from "../../src/voice/transcriptionProvider.js";

function findRecordingForTranscription(record = {}) {
    const recordings = Array.isArray(record.recordings) ? record.recordings : [];
    const answers = Array.isArray(record.answers) ? record.answers : [];
    const pendingAnswer = answers.find((answer) => answer?.transcriptionPending === true);

    if (pendingAnswer?.recordingSid) {
        const bySid = recordings.find((recording) => recording?.RecordingSid === pendingAnswer.recordingSid);
        if (bySid) return bySid;
    }

    if (pendingAnswer?.recordingUrl) {
        const byUrl = recordings.find((recording) => recording?.RecordingUrl === pendingAnswer.recordingUrl);
        if (byUrl) return byUrl;
    }

    return recordings.at(-1) || null;
}

export async function transcribeLogic(params = {}, io) {
    if (!params.callId) {
        throw new ToolError("INVALID_PARAMS", "callId is required.");
    }

    let record;
    try {
        record = await io.getCall(params.callId);
    } catch {
        throw new ToolError("CALL_NOT_FOUND", "Call not found.", { callId: params.callId });
    }

    const summary = summarizeTranscriptionState(record, io.env || {});
    if (!summary.enabled) {
        return summary;
    }

    const recording = findRecordingForTranscription(record);
    if (!recording?.RecordingUrl) {
        return {
            ...summary,
            ok: false,
            status: "missing_recording_url",
            message: "RecordingUrl is required before transcription can run."
        };
    }

    const provider = createTranscriptionProvider(io.env || {}, { fetch: io.fetch });
    const transcription = await provider.transcribeRecording({ record, recording });
    if (!transcription.ok) {
        return {
            ...summary,
            ok: false,
            status: transcription.status,
            message: transcription.message
        };
    }

    if (typeof io.saveCall !== "function") {
        throw new ToolError("NOT_CONFIGURED", "voice.transcribe requires saveCall IO to persist transcription results.");
    }

    const updated = updatePendingTranscriptionInRecord(record, recording, transcription);
    await io.saveCall(updated);

    return {
        ...summary,
        status: transcription.status,
        message: transcription.message,
        text: transcription.text,
        transcriptionPendingAnswersFound: updated.answers.filter((answer) => answer?.transcriptionPending === true).length
    };
}
