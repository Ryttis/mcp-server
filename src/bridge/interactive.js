import WebSocket from "ws";
import readline from "readline";

export function startInteractiveBridge(serverUrl) {
    const ws = new WebSocket(serverUrl);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    ws.on("open", () => {
        console.log(`✅ Connected to MCP server: ${serverUrl}`);
        prompt();
    });

    ws.on("message", (msg) => {
        console.log("📡 Response:", msg.toString());
        prompt();
    });

    ws.on("error", (err) => console.error("⚠️ WebSocket error:", err.message));
    ws.on("close", () => {
        console.log("❌ Disconnected from MCP server");
        process.exit(0);
    });

    let id = 1;
    function prompt() {
        rl.question("> ", (line) => {
            if (line === "exit") return process.exit(0);
            const [method, ...args] = line.split(" ");
            ws.send(JSON.stringify({ id: id++, method, params: args }));
        });
    }
}
