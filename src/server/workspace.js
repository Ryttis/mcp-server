import path from "path";

export function initWorkspaces() {
    return {
        core: path.resolve("./"),
        etno: process.env.ETNOLENTOS_PATH || "",
        factura: process.env.FACTURACORE_PATH || "",
    };
}
