/**
 * ToolError
 *
 * Standard error type for all MCP tools.
 * Used to normalize errors across kernel and bridge.
 */
export class ToolError extends Error {
    /**
     * @param {string} code - Stable machine-readable error code.
     * @param {string} message - Human-readable error message.
     * @param {object} [data] - Optional structured context.
     */
    constructor(code, message, data = undefined) {
        super(message);
        this.name = "ToolError";
        this.code = code;
        if (data !== undefined) {
            this.data = data;
        }
        Error.captureStackTrace?.(this, ToolError);
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            data: this.data,
        };
    }
}
