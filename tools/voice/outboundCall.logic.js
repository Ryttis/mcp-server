import { ToolError } from "../../errors/ToolError.js";
import { createMockOutboundCall } from "../../src/voice/mockProvider.js";
import { createTwilioOutboundCall } from "../../src/voice/twilioProvider.js";
import { isE164PhoneNumber, parseAllowedTestNumbers } from "../../src/voice/phoneValidation.js";

function voiceProvider(env) {
    return env.VOICE_PROVIDER || "mock";
}

function validateSinglePhoneNumber(phoneNumber) {
    if (Array.isArray(phoneNumber)) {
        throw new ToolError("INVALID_PARAMS", "voice.outboundCall accepts exactly one phoneNumber.");
    }

    if (!phoneNumber) {
        throw new ToolError("INVALID_PARAMS", "phoneNumber is required.");
    }

    if (!isE164PhoneNumber(phoneNumber)) {
        throw new ToolError("INVALID_PARAMS", "phoneNumber must be valid E.164 format.");
    }
}

function validateScript(script) {
    if (!script || typeof script !== "object") {
        throw new ToolError("INVALID_PARAMS", "script is required.");
    }

    if (!script.intro || typeof script.intro !== "string") {
        throw new ToolError("INVALID_PARAMS", "script.intro is required.");
    }

    if (!script.closing || typeof script.closing !== "string") {
        throw new ToolError("INVALID_PARAMS", "script.closing is required.");
    }

    if (!Array.isArray(script.questions)) {
        throw new ToolError("INVALID_PARAMS", "script.questions must be an array.");
    }
}

function validateResponseMode(responseMode) {
    if (responseMode === undefined || responseMode === null) return;
    if (responseMode !== "gather" && responseMode !== "record") {
        throw new ToolError("INVALID_PARAMS", "responseMode must be gather or record.");
    }
}

function validateAllowedNumber(phoneNumber, env, warnings, provider) {
    const allowedNumbers = parseAllowedTestNumbers(env.VOICE_ALLOWED_TEST_NUMBERS);

    if (allowedNumbers.length === 0) {
        if (provider === "mock") {
            warnings.push("VOICE_ALLOWED_TEST_NUMBERS is not set; mock call allowed only because provider=mock.");
            return;
        }
        throw new ToolError(
            "PHONE_NUMBER_NOT_ALLOWED",
            "VOICE_ALLOWED_TEST_NUMBERS must include phoneNumber before Twilio calls are allowed.",
            { phoneNumber }
        );
    }

    if (!allowedNumbers.includes(phoneNumber)) {
        throw new ToolError(
            "PHONE_NUMBER_NOT_ALLOWED",
            "phoneNumber is not included in VOICE_ALLOWED_TEST_NUMBERS.",
            { phoneNumber }
        );
    }
}

export async function outboundCallLogic(params = {}, io) {
    const env = io.env || {};
    const provider = voiceProvider(env);

    if (provider !== "mock" && provider !== "twilio") {
        throw new ToolError("PROVIDER_NOT_IMPLEMENTED", "Only mock and twilio voice providers are implemented.");
    }

    if (params.approved !== true) {
        throw new ToolError("APPROVAL_REQUIRED", "approved must be true.");
    }

    validateSinglePhoneNumber(params.phoneNumber);

    if (params.language !== "lt-LT") {
        throw new ToolError("UNSUPPORTED_LANGUAGE", "Only language lt-LT is supported.");
    }

    validateScript(params.script);
    validateResponseMode(params.responseMode);

    const warnings = [];
    if (provider === "mock" && env.VOICE_CALLS_ENABLED === "true") {
        warnings.push("VOICE_CALLS_ENABLED is true but provider=mock; real calls are still disabled.");
    }
    validateAllowedNumber(params.phoneNumber, env, warnings, provider);

    if (provider === "twilio") {
        return createTwilioOutboundCall({ ...params, warnings }, io);
    }

    return createMockOutboundCall({ ...params, warnings }, io);
}
