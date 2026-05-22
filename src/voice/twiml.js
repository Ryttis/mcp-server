function escapeXml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

export function createSafeTwiml(message = "Call configuration not found.") {
    return `<Response><Say>${escapeXml(message)}</Say></Response>`;
}

function actionUrl(record, path) {
    const query = `callId=${encodeURIComponent(record.callId)}`;
    const baseUrl = String(record.publicVoiceBaseUrl || "").replace(/\/+$/, "");
    return baseUrl ? `${baseUrl}${path}?${query}` : `${path}?${query}`;
}

function envValue(env, name) {
    return String(env?.[name] || "").trim();
}

function recordPlayBeep(env) {
    const value = envValue(env, "VOICE_RECORD_PLAY_BEEP").toLowerCase();
    return value === "false" ? "false" : "true";
}

function promptVerb(spoken, env) {
    const audioUrl = envValue(env, "VOICE_PROMPT_AUDIO_URL");
    if (audioUrl) {
        return `  <Play>${escapeXml(audioUrl)}</Play>`;
    }
    return `  <Say language="lt-LT">${escapeXml(spoken)}</Say>`;
}

export function createOutboundCallTwiml(record, options = {}) {
    if (!record || typeof record !== "object") {
        return createSafeTwiml();
    }

    const script = record.scriptPreview || {};
    const intro = script.intro || "";
    const question = Array.isArray(script.questions) ? script.questions[0] : "";
    const closing = script.closing || "";
    const spoken = [intro, question].filter(Boolean).join(" ");
    const responseMode = record.responseMode || "gather";

    if (!question) {
        return [
            "<Response>",
            spoken ? `  <Say language="lt-LT">${escapeXml(spoken)}</Say>` : "",
            closing ? `  <Say language="lt-LT">${escapeXml(closing)}</Say>` : "",
            "</Response>"
        ].filter(Boolean).join("\n");
    }

    if (responseMode === "record") {
        const recordingAction = escapeXml(actionUrl(record, "/voice/twilio/recording-result"));
        return [
            "<Response>",
            promptVerb(spoken, options.env),
            `  <Record action="${recordingAction}" method="POST" maxLength="30" timeout="7" trim="do-not-trim" playBeep="${recordPlayBeep(options.env)}" recordingStatusCallback="${recordingAction}" recordingStatusCallbackMethod="POST" recordingStatusCallbackEvent="completed" />`,
            "</Response>"
        ].join("\n");
    }

    return [
        "<Response>",
        `  <Gather input="speech" language="lt-LT" action="${escapeXml(actionUrl(record, "/voice/twilio/gather"))}" method="POST" timeout="8" speechTimeout="auto" actionOnEmptyResult="true">`,
        `    <Say language="lt-LT">${escapeXml(spoken)}</Say>`,
        "  </Gather>",
        closing ? `  <Say language="lt-LT">${escapeXml(closing)}</Say>` : "",
        "</Response>"
    ].filter(Boolean).join("\n");
}

export function createGatherThanksTwiml() {
    return '<Response><Say language="lt-LT">Ačiū. Viso gero.</Say></Response>';
}
