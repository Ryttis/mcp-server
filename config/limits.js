/**
 * Kernel resource limits.
 * Central place for all safety guards.
 */
export const LIMITS = {
    MAX_FILE_SIZE: 1024 * 1024, // 1 MB

    MAX_DIR_ENTRIES: 1000,
    MAX_DIR_DEPTH: 5,

    ALLOWED_ROOTS: {
        CORE: null,
        ETNO: "ETNOLENTOS_PATH",
        FACTURA: "FACTURACORE_PATH",
    },

    TOOL_TIMEOUT_MS: 10_000,
};
