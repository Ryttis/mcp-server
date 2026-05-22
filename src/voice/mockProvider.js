import { randomUUID } from "crypto";

function previewScript(script) {
    return {
        intro: script.intro,
        questions: script.questions,
        closing: script.closing
    };
}

export async function createMockOutboundCall(params, io) {
    const createdAt = new Date().toISOString();
    const callId = `mock-call-${randomUUID()}`;
    const record = {
        ok: true,
        dryRun: true,
        provider: "mock",
        callId,
        status: "mock_queued",
        phoneNumber: params.phoneNumber,
        language: params.language,
        purpose: params.purpose ?? null,
        message: "Real calls are disabled.",
        scriptPreview: previewScript(params.script),
        responseMode: params.responseMode || "gather",
        gatherSpeech: params.gatherSpeech === true,
        record: params.record === true,
        metadata: params.metadata && typeof params.metadata === "object" ? params.metadata : {},
        warnings: params.warnings || [],
        createdAt
    };

    await io.saveCall(record);

    return record;
}

export function mockCallResult(record) {
    return {
        ok: true,
        callId: record.callId,
        provider: "mock",
        providerCallSid: record.providerCallSid,
        status: record.status,
        transcript: [],
        answers: [],
        summary: "Mock call only. No real call was placed."
    };
}
