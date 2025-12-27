import { parseLogFile } from "@ryttis/logpilot";

/**
 * IO layer for logParse tool.
 * Delegates to external log parser.
 */
export const logParseIO = {
    async parse(path) {
        return parseLogFile(path);
    }
};
