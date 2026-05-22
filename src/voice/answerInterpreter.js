const SUPPORTED_PROVIDERS = new Set(["none", "openai"]);
const DEFAULT_PROVIDER = "none";
const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const VALID_INTENTS = new Set([
    "has_part", "does_not_have_part", "has_alternative",
    "unclear", "asked_to_repeat", "needs_check"
]);
const VALID_SIDES = new Set(["left", "right", "unknown"]);
const VALID_AVAILABILITY = new Set(["yes", "no", "partial", "unknown"]);

export function getInterpreterConfig(env = process.env) {
    const raw = String(env.VOICE_ANSWER_INTERPRETER_PROVIDER || DEFAULT_PROVIDER).trim().toLowerCase();
    const provider = SUPPORTED_PROVIDERS.has(raw) ? raw : "none";
    return {
        provider,
        model: env.VOICE_ANSWER_INTERPRETER_MODEL || DEFAULT_MODEL,
        openaiApiKey: env.OPENAI_API_KEY || ""
    };
}

function buildPrompt({ text, question, partName, expectedSide }) {
    const contextLines = [
        question ? `Klausimas operatoriui: ${question}` : null,
        partName ? `Užklausta detalė: ${partName}` : null,
        expectedSide ? `Laukiama pusė: ${expectedSide}` : null
    ].filter(Boolean);

    const context = contextLines.length > 0
        ? `Kontekstas:\n${contextLines.join("\n")}\n\n`
        : "";

    return `Tu esi automobilio atsarginių detalių pardavimo skambučio atsakymų interpretatorius.
Grąžink TIK JSON objektą (jokio kito teksto):

{
  "language": "lt",
  "intent": "<has_part|does_not_have_part|has_alternative|unclear|asked_to_repeat|needs_check>",
  "confidence": <0.0-1.0>,
  "summaryLt": "<trumpas atsakymo santrauka lietuviškai>",
  "partMatched": <true|false>,
  "sideMatched": <true|false>,
  "mentionedPart": "<paminėta detalė arba null>",
  "mentionedSide": "<left|right|unknown>",
  "availability": "<yes|no|partial|unknown>",
  "followUpNeeded": <true|false>,
  "followUpQuestionLt": "<sekantis klausimas arba null>"
}

Taisyklės:
- Jei neaišku — grąžink intent="unclear" arba "needs_check". NIEKADA nekurk "yes" availability iš savęs.
- STT tekstas gali turėti klaidų — interpretuok pagal prasmę.
- Jei pardavėjas prašė pakartoti — intent="asked_to_repeat".
- Jei turi tik vieną pusę kai prašyta kitos — intent="has_alternative", sideMatched=false.

${context}Pardavėjo atsakymas (STT):
"${String(text || "").replace(/"/g, "'")}"`;
}

function safeParseJson(raw) {
    try {
        const s = String(raw || "").trim();
        const start = s.indexOf("{");
        const end = s.lastIndexOf("}");
        if (start === -1 || end === -1) return null;
        return JSON.parse(s.slice(start, end + 1));
    } catch {
        return null;
    }
}

function normalizeResult(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    return {
        language: "lt",
        intent: VALID_INTENTS.has(parsed.intent) ? parsed.intent : "unclear",
        confidence: typeof parsed.confidence === "number"
            ? Math.min(1, Math.max(0, parsed.confidence))
            : 0,
        summaryLt: typeof parsed.summaryLt === "string" ? parsed.summaryLt : "",
        partMatched: parsed.partMatched === true,
        sideMatched: parsed.sideMatched === true,
        mentionedPart: typeof parsed.mentionedPart === "string" ? parsed.mentionedPart : null,
        mentionedSide: VALID_SIDES.has(parsed.mentionedSide) ? parsed.mentionedSide : "unknown",
        availability: VALID_AVAILABILITY.has(parsed.availability) ? parsed.availability : "unknown",
        followUpNeeded: parsed.followUpNeeded === true,
        followUpQuestionLt: typeof parsed.followUpQuestionLt === "string" ? parsed.followUpQuestionLt : null
    };
}

export function createAnswerInterpreter(env = process.env, options = {}) {
    const config = getInterpreterConfig(env);
    const fetchImpl = options.fetch || globalThis.fetch;

    return {
        provider: config.provider,
        enabled: config.provider !== "none",

        async interpretAnswer(input = {}) {
            if (config.provider === "none") {
                return { disabled: true };
            }

            const text = typeof input.text === "string" ? input.text.trim() : "";
            if (!text) {
                return { disabled: false, skipped: true, reason: "empty_transcript" };
            }

            if (!config.openaiApiKey) {
                return {
                    disabled: false,
                    skipped: false,
                    interpretationError: "OPENAI_API_KEY is required for VOICE_ANSWER_INTERPRETER_PROVIDER=openai."
                };
            }

            if (!fetchImpl) {
                return {
                    disabled: false,
                    skipped: false,
                    interpretationError: "fetch implementation required for answer interpretation."
                };
            }

            const prompt = buildPrompt({
                text,
                question: input.question,
                partName: input.partName,
                expectedSide: input.expectedSide
            });

            let response;
            try {
                response = await fetchImpl(OPENAI_CHAT_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${config.openaiApiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: config.model,
                        temperature: 0,
                        response_format: { type: "json_object" },
                        messages: [{ role: "user", content: prompt }]
                    })
                });
            } catch (err) {
                return {
                    disabled: false,
                    skipped: false,
                    interpretationError: `Interpretation request failed: ${err?.message || "unknown error"}`
                };
            }

            if (!response.ok) {
                let body = "";
                try { body = await response.text(); } catch { /* ignore */ }
                return {
                    disabled: false,
                    skipped: false,
                    interpretationError: `OpenAI interpretation HTTP ${response.status}.${body ? ` ${body.slice(0, 200)}` : ""}`
                };
            }

            let data;
            try {
                data = await response.json();
            } catch {
                return {
                    disabled: false,
                    skipped: false,
                    interpretationError: "Failed to parse OpenAI interpretation response."
                };
            }

            const rawContent = data?.choices?.[0]?.message?.content ?? "";
            const parsed = safeParseJson(rawContent);
            const normalized = normalizeResult(parsed);

            if (!normalized) {
                return {
                    disabled: false,
                    skipped: false,
                    interpretationError: `Could not parse interpretation JSON from model: ${String(rawContent).slice(0, 200)}`
                };
            }

            return { disabled: false, skipped: false, ...normalized };
        }
    };
}
