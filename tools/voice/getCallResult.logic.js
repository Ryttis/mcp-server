import { ToolError } from "../../errors/ToolError.js";
import { mockCallResult } from "../../src/voice/mockProvider.js";
import { twilioCallResult } from "../../src/voice/twilioProvider.js";

export async function getCallResultLogic(params = {}, io) {
    if (!params.callId) {
        throw new ToolError("INVALID_PARAMS", "callId is required.");
    }

    try {
        const record = await io.getCall(params.callId);
        if (record.provider === "twilio") {
            return twilioCallResult(record);
        }
        return mockCallResult(record);
    } catch {
        throw new ToolError("CALL_NOT_FOUND", "Call not found.", { callId: params.callId });
    }
}
