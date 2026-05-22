import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";

const DEFAULT_CALL_DIR = path.join(process.cwd(), "data", "voice-calls");

function assertSafeCallId(callId) {
    if (typeof callId !== "string" || !/^(mock-call|twilio-call)-[A-Za-z0-9_-]+$/.test(callId)) {
        throw new Error("Invalid callId");
    }
}

export function createCallStore(baseDir = DEFAULT_CALL_DIR) {
    return {
        baseDir,

        async save(record) {
            assertSafeCallId(record?.callId);
            await mkdir(baseDir, { recursive: true });
            const filePath = path.join(baseDir, `${record.callId}.json`);
            await writeFile(filePath, JSON.stringify(record, null, 2), "utf8");
            return { ...record, filePath };
        },

        async get(callId) {
            assertSafeCallId(callId);
            const filePath = path.join(baseDir, `${callId}.json`);
            const content = await readFile(filePath, "utf8");
            return JSON.parse(content);
        }
    };
}

export const callStore = createCallStore();
