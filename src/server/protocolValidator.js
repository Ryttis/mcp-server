import Ajv from "ajv";
import addFormats from "ajv-formats";

import memoryContextSchema from "mcp-protocol/versions/v1/context/memory.json" with { type: "json" };
import toolInputIndex from "mcp-protocol/versions/v1/tools/input/index.json" with { type: "json" };
import toolOutputIndex from "mcp-protocol/versions/v1/tools/output/index.json" with { type: "json" };

const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: false
});

addFormats(ajv);

ajv.addSchema(memoryContextSchema, "mcp://protocol/v1/context/memory");

const inputSchemas = toolInputIndex.properties || {};
const outputSchemas = toolOutputIndex.properties || {};

for (const schema of Object.values(inputSchemas)) {
    if (schema.$id) ajv.addSchema(schema);
}

for (const schema of Object.values(outputSchemas)) {
    if (schema.$id) ajv.addSchema(schema);
}

const validateMemoryContext = ajv.getSchema("mcp://protocol/v1/context/memory");

const toolInputValidators = {};
const toolOutputValidators = {};

for (const [toolName, schema] of Object.entries(inputSchemas)) {
    toolInputValidators[toolName] = ajv.compile(schema);
}

for (const [toolName, schema] of Object.entries(outputSchemas)) {
    toolOutputValidators[toolName] = ajv.compile(schema);
}

const MODE = process.env.MCP_PROTOCOL_MODE || "mirror";

function handleViolation(message, errors) {
    if (MODE === "enforce") {
        const err = new Error(message);
        err.code = "PROTOCOL_VIOLATION";
        err.details = errors;
        throw err;
    } else {
        console.warn("⚠️ [MCP-PROTOCOL WARNING]", message, errors);
    }
}

export function validateContextBlock(block) {
    const valid = validateMemoryContext(block);
    if (!valid) {
        handleViolation("Invalid mcp.context.memory block", validateMemoryContext.errors);
    }
    return true;
}

export function validateToolInput(toolName, payload) {
    const validator = toolInputValidators[toolName];
    if (!validator) return true;

    const valid = validator(payload);
    if (!valid) {
        handleViolation(`Invalid input for tool ${toolName}`, validator.errors);
    }
    return true;
}

export function validateToolOutput(toolName, payload) {
    const validator = toolOutputValidators[toolName];
    if (!validator) return true;

    const valid = validator(payload);
    if (!valid) {
        handleViolation(`Invalid output for tool ${toolName}`, validator.errors);
    }
    return true;
}
