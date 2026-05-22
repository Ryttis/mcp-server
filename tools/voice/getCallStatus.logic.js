import { ToolError } from "../../errors/ToolError.js";

export async function getCallStatusLogic(params = {}, io) {
    if (!params.callId) {
        throw new ToolError("INVALID_PARAMS", "callId is required.");
    }

    try {
        const record = await io.getCall(params.callId);
        return {
            ok: true,
            callId: record.callId,
            provider: record.provider,
            providerCallSid: record.providerCallSid,
            status: record.status,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };
    } catch {
        throw new ToolError("CALL_NOT_FOUND", "Call not found.", { callId: params.callId });
    }
}
