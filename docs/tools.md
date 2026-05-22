# MCP Server — Tool Surface (v1)

Version: v1.0 (Frozen)
Status: Stable Infrastructure Surface  
Owner: MCP Server Kernel

This document defines the complete public tool surface exposed by **mcp-server**.
All tools listed here are considered **v1 stable**.

Rules:
- No renaming of tools.
- No breaking input/output changes.
- New tools require a new milestone and explicit decision.
- Deprecations must be documented here before removal.
- RPC input validation is selective: tools with `mcp-protocol` schemas are validated centrally; uncovered tools continue to run.
- RPC output validation is warning-mode only for now.
- Default tool timeout is 120000 ms.

---

## 🔒 Versioning & Stability

- All tools in this document are **v1**.
- Backward compatibility is required.
- Any breaking change implies a future **v2** milestone.
- Deprecated tools must:
    - be marked here,
    - remain for at least one milestone,
    - provide a replacement.

---

## 📦 Tool Groups

- **core/** — generic infrastructure and system tools
- **etno/** — Etno Lentos / CNC-related domain tools
- **factura/** — FacturaCore / ERP-related domain tools
- **voice/** — outbound voice call foundation with mock mode and tightly gated Twilio testing

---

## 🛠 Tool Index

### core
- core.ping
- core.getTime
- core.debugState
- core.projectStatus
- core.snapshotServer
- core.snapshotTool
- core.getLastScan
- core.setLastContext
- core.cache
- core.listDir
- core.readFile
- core.readProjectFile
- core.writeFile
- core.runCommand
- core.dbQuery
- core.checkBilling
- core.logParse
- core.logSummarize
- core.analyzeGcode
- core.analyzeFile
- core.memoryIngest
- core.memoryQuery
- core.llmComplete

### etno
- etno.listDir
- etno.readFile
- etno.summarizeFile
- etno.parseMaterial

### factura
- factura.readFile

### voice
- voice.outboundCall
- voice.getCallStatus
- voice.getCallResult
- voice.transcribe

---

## 📘 Tool Contracts

> All tools must eventually conform to:
> - explicit input schema
> - explicit output schema
> - standardized ToolError errors

Below are the frozen v1 contracts (to be refined in later steps without breaking changes).

---

### core.ping

**Description:** Health check tool. Confirms server is alive.

- **Input:** none
- **Output:** `{ ok: boolean }`
- **Errors:** none

---

### core.getTime

**Description:** Returns current server time.

- **Input:** none
- **Output:** `{ iso: string, timestamp: number }`
- **Errors:** ToolError[TIME_ERROR]

---

### core.debugState

**Description:** Returns internal debug information about server state.

- **Input:** none
- **Output:** `object`
- **Errors:** ToolError[INTERNAL_ERROR]

---

### core.projectStatus

**Description:** Returns status of current project/workspace.

- **Input:** `{ root?: string }`
- **Output:** `object`
- **Errors:** ToolError[INVALID_ROOT, INTERNAL_ERROR]

---

### core.snapshotServer

**Description:** Creates a snapshot of server state.

- **Input:** `{}`
- **Output:** `{ snapshotId: string }`
- **Errors:** ToolError[SNAPSHOT_FAILED]

---

### core.snapshotTool

**Description:** Creates a snapshot via tool-level logic.

- **Input:** `{}`
- **Output:** `{ snapshotId: string }`
- **Errors:** ToolError[SNAPSHOT_FAILED]

---

### core.getLastScan

**Description:** Returns metadata about last project scan.

- **Input:** none
- **Output:** `object | null`
- **Errors:** ToolError[INTERNAL_ERROR]

---

### core.setLastContext

**Description:** Sets last known context/state reference.

- **Input:** `{ context: object }`
- **Output:** `{ ok: boolean }`
- **Errors:** ToolError[INVALID_INPUT, INTERNAL_ERROR]

---

### core.cache

**Description:** Cache helper for storing/retrieving temporary values.

- **Input:** `{ key: string, value?: any, action: "get" | "set" | "clear" }`
- **Output:** `{ value?: any }`
- **Errors:** ToolError[CACHE_ERROR]

---

### core.listDir

**Description:** Lists directory contents.

- **Input:** `{ path: string }`
- **Output:** `{ entries: string[] }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.readFile

**Description:** Reads a file from disk.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, FILE_TOO_LARGE]

---

### core.readProjectFile

**Description:** Reads a file relative to project root.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.writeFile

**Description:** Writes content to a file.

- **Input:** `{ path: string, content: string }`
- **Output:** `{ ok: boolean }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, FILE_TOO_LARGE]

---

### core.runCommand

**Description:** Runs a shell command.

- **Input:** `{ command: string, args?: string[] }`
- **Output:** `{ stdout: string, stderr: string, code: number }`
- **Errors:** ToolError[COMMAND_FAILED, TIMEOUT]

---

### core.dbQuery

**Description:** Executes a database query.

- **Input:** `{ query: string, params?: any[] }`
- **Output:** `{ rows: any[] }`
- **Errors:** ToolError[DB_ERROR]

---

### core.checkBilling

**Description:** Checks billing or license status.

- **Input:** none
- **Output:** `object`
- **Errors:** ToolError[BILLING_ERROR]

---

### core.logParse

**Description:** Parses log file into structured entries.

- **Input:** `{ path: string }`
- **Output:** `{ entries: object[] }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.logSummarize

**Description:** Summarizes parsed logs.

- **Input:** `{ path: string }`
- **Output:** `{ summary: object }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.analyzeGcode

**Description:** Analyzes G-code file and returns metrics.

- **Input:** `{ path: string }`
- **Output:** `object`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, PARSE_ERROR]

---
### core.analyzeFile

> [MIGRATION] Moved from mcp-bridge analyze command.

Analyze a file using AI.

**Input:**
- `path` (string) — path to file.

**Output:**
- `path` — file path
- `length` — content length
- `analysis` — AI-generated analysis

**Errors:**
- INVALID_INPUT
- FILE_TOO_LARGE
- OPENAI_KEY_MISSING
- AI_ERROR

---

### core.memoryIngest

**Description:** Ingests text into `mcp-memory`.

- **Input:** `{ text: string, id?: string | null, metadata?: object }`
- **Output:** `{ ok: true, id: string }`
- **Errors:** ToolError[INVALID_INPUT, MEMORY_ERROR]

---

### core.memoryQuery

**Description:** Queries `mcp-memory`.

- **Input:** `{ query: string, topK?: number }`
- **Output:** `{ results: object[] }`
- **Errors:** ToolError[INVALID_INPUT, MEMORY_ERROR]

---

### core.llmComplete

**Description:** Completes a prompt using OpenAI.

- **Input:** `{ prompt: string, systemPrompt?: string, model?: string, response_format?: any }`
- **Output:** `{ text: string }`
- **Default model:** `gpt-4o-mini`
- **Errors:** ToolError[INVALID_INPUT, OPENAI_KEY_MISSING, AI_ERROR]

### etno.listDir

**Description:** Etno domain directory listing.

- **Input:** `{ path: string }`
- **Output:** `{ entries: string[] }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### etno.readFile

**Description:** Reads Etno domain file.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### etno.summarizeFile

**Description:** Summarizes Etno domain file content.

- **Input:** `{ path: string }`
- **Output:** `{ summary: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### etno.parseMaterial

**Description:** Parses CNC material description.

- **Input:** `{ path: string }`
- **Output:** `object`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, PARSE_ERROR]

---

### factura.readFile

**Description:** Reads Factura domain file.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### voice.outboundCall

**Description:** Creates one outbound call record. `VOICE_PROVIDER=mock` keeps the existing dry-run behavior; `VOICE_PROVIDER=twilio` can place exactly one Twilio call only when all safety gates pass.

- **Input:** `{ phoneNumber: string, language: "lt-LT", purpose?: string, approved: true, script: { intro: string, questions: string[], closing: string }, responseMode?: "gather" | "record", gatherSpeech?: boolean, record?: boolean, metadata?: object }`
- **Output:** `{ ok: true, dryRun: boolean, provider: "mock" | "twilio", callId: string, providerCallSid?: string, status: string, phoneNumber: string, language: "lt-LT", purpose?: string, message: string, scriptPreview: object, responseMode?: "gather" | "record", metadata: object, warnings?: string[], createdAt: string }`
- **Storage:** `data/voice-calls/<callId>.json`
- **Errors:** ToolError[APPROVAL_REQUIRED, INVALID_PARAMS, UNSUPPORTED_LANGUAGE, PHONE_NUMBER_NOT_ALLOWED, PROVIDER_NOT_IMPLEMENTED, CALLS_DISABLED, MISSING_TWILIO_CONFIG]
- **Safety:** Never accepts multiple numbers, never calls unless `approved === true`, never calls unless `VOICE_CALLS_ENABLED=true`, never calls unless `VOICE_PROVIDER=twilio`, never calls unless the phone number is in `VOICE_ALLOWED_TEST_NUMBERS`, and never returns provider secrets.

`responseMode`:
- `gather` is the default. Use it when you want Twilio to perform speech recognition directly during the call and store `SpeechResult`/`Confidence`.
- `record` plays the intro and first question, then records the caller answer. Use it as the preferred Lithuanian test path right now because Twilio's built-in speech recognition is not reliable enough for Lithuanian. Configure `VOICE_PROMPT_AUDIO_URL` with recorded/native Lithuanian audio or generated audio for the prompt; Twilio `<Say>` remains only a fallback and should not be treated as the final Lithuanian prompt solution.
- `record` does not transcribe audio while `VOICE_TRANSCRIPTION_PROVIDER=none`. `voice.getCallResult` can show `recordings`, a `caller_recording` transcript item with `text: null`, and an answer with `transcriptionPending: true`.
- `record` can transcribe the saved Twilio recording when `VOICE_TRANSCRIPTION_PROVIDER=openai` and `OPENAI_API_KEY` are configured. The server fetches `RecordingUrl` with Twilio Basic auth, submits the audio to OpenAI with Lithuanian language `lt`, stores the transcribed text plus provider/model/language/duration diagnostics, and marks `transcriptionPending: false` only when non-empty text was saved.

Environment:
- `VOICE_PROVIDER=twilio` enables the Twilio provider. Default is `mock`.
- `VOICE_CALLS_ENABLED=true` is required for a real Twilio call.
- `VOICE_ALLOWED_TEST_NUMBERS=+37062071053` gates real Twilio calls to explicitly listed E.164 test numbers. Use a comma-separated list only for controlled test numbers.
- `PUBLIC_VOICE_BASE_URL=https://your-ngrok-host.ngrok-free.app` must be the public HTTPS tunnel URL that Twilio can reach, not `localhost` or a private LAN address. Update it whenever the ngrok URL changes.
- `TWILIO_ACCOUNT_SID=...`
- `TWILIO_AUTH_TOKEN=...`
- `TWILIO_FROM_NUMBER=...`
- `VOICE_PROMPT_AUDIO_URL=https://cdn.example.test/lt-record-prompt.wav` is optional for `responseMode="record"`. When set, TwiML uses `<Play>` before `<Record>` instead of Twilio `<Say>`. Prefer a native speaker recording or high-quality generated Lithuanian audio.
- `VOICE_RECORD_PLAY_BEEP=false` is optional. The default is `true` so the answer beep is clear.
- `VOICE_TRANSCRIPTION_PROVIDER=none` is the default and keeps transcription disabled.
- `VOICE_TRANSCRIPTION_PROVIDER=openai` enables OpenAI audio transcription for recorded Twilio audio.
- `VOICE_TRANSCRIPTION_LANGUAGE=lt-LT` is the default transcription language.
- `OPENAI_API_KEY=...` is required when `VOICE_TRANSCRIPTION_PROVIDER=openai`.
- `OPENAI_TRANSCRIPTION_MODEL=whisper-1` is the default OpenAI transcription model override.

Twilio webhook routes served by `server.js`:
- `GET|POST /voice/twilio/twiml?callId=<callId>` returns TwiML with the Lithuanian intro and first script question.
- `responseMode="gather"` returns `<Gather input="speech" language="lt-LT" ...>` and asks Twilio to recognize caller speech directly. Gather TwiML uses an absolute `PUBLIC_VOICE_BASE_URL` action URL, `timeout="8"`, `speechTimeout="auto"`, and `actionOnEmptyResult="true"`.
- `responseMode="record"` plays `VOICE_PROMPT_AUDIO_URL` with `<Play>` when configured; otherwise it falls back to `<Say language="lt-LT">`. It then returns `<Record action="<PUBLIC_VOICE_BASE_URL>/voice/twilio/recording-result?callId=<callId>" method="POST" maxLength="30" timeout="7" trim="do-not-trim" playBeep="true" recordingStatusCallback="<PUBLIC_VOICE_BASE_URL>/voice/twilio/recording-result?callId=<callId>" recordingStatusCallbackMethod="POST" recordingStatusCallbackEvent="completed" />`. Both callbacks use the same storage route; duplicate `RecordingSid` callbacks are ignored. `VOICE_RECORD_PLAY_BEEP=false` can disable the beep, but the default keeps it enabled.
- `POST /voice/twilio/gather?callId=<callId>` stores Twilio `SpeechResult` and `Confidence`.
- `POST /voice/twilio/recording-result?callId=<callId>` stores `RecordingSid`, `RecordingUrl`, `RecordingDuration`, `CallSid`, and a timestamp; it appends a `caller_recording` transcript item and an answer. With the default provider, no external STT provider is called and the answer remains `transcriptionPending: true`. With `VOICE_TRANSCRIPTION_PROVIDER=openai`, the route transcribes the recording, saves transcription diagnostics, and stores `transcriptionPending: false` only when non-empty text was saved.
- `POST /voice/twilio/status?callId=<callId>` stores safe Twilio status fields and updates the local status.

---

### voice.getCallStatus

**Description:** Reads status for a saved mock or Twilio voice call.

- **Input:** `{ callId: string }`
- **Output:** `{ ok: true, callId: string, provider: "mock" | "twilio", providerCallSid?: string, status: string, createdAt: string, updatedAt?: string }`
- **Errors:** ToolError[INVALID_PARAMS, CALL_NOT_FOUND]

---

### voice.getCallResult

**Description:** Reads the result shape for a saved mock or Twilio voice call.

- **Input:** `{ callId: string }`
- **Output:** `{ ok: true, callId: string, provider: "mock" | "twilio", providerCallSid?: string, status: string, transcript: [], answers: [], recordings?: [], summary: string }`
- **Errors:** ToolError[INVALID_PARAMS, CALL_NOT_FOUND]

---

### voice.transcribe

**Description:** Manual transcription trigger for saved recorded calls. It is safe by default: with `VOICE_TRANSCRIPTION_PROVIDER=none`, it only reports provider state and counts recordings/pending answers. With `VOICE_TRANSCRIPTION_PROVIDER=openai`, it fetches the Twilio `RecordingUrl` using `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`, transcribes Lithuanian audio through OpenAI, updates the matching pending transcript/answer, and returns the text.

- **Input:** `{ callId: string }`
- **Output:** `{ ok: boolean, callId: string, provider: "none" | "google" | "openai", language: string, enabled: boolean, status?: string, message: string, recordingsFound: number, transcriptionPendingAnswersFound: number, text?: string }`
- **Errors:** ToolError[INVALID_PARAMS, CALL_NOT_FOUND]

Clear transcription errors:
- Missing `RecordingUrl` returns `ok: false`, `status: "missing_recording_url"`, and `message: "RecordingUrl is required before transcription can run."`
- Missing `OPENAI_API_KEY` with `VOICE_TRANSCRIPTION_PROVIDER=openai` returns `ok: false`, `status: "not_configured"`, and `message: "OPENAI_API_KEY is required when VOICE_TRANSCRIPTION_PROVIDER=openai."`

Bridge command:

```bash
cd /Users/Ryttis/mcp-bridge
node bridge.js voice-transcribe --call-id "twilio-call-..." --json
```

---

### Manual Twilio first-call flow

Keep real calls disabled by default:

```bash
export VOICE_PROVIDER=mock
export VOICE_CALLS_ENABLED=false
export VOICE_ALLOWED_TEST_NUMBERS=+37062071053
```

Run the mock bridge command below first and confirm it returns `provider: "mock"` and `dryRun: true`.

To test Twilio later, expose this server to Twilio with a public HTTPS URL, for example by running an HTTPS ngrok tunnel to local port `4000` and setting:

```bash
export PUBLIC_VOICE_BASE_URL=https://your-ngrok-host.ngrok-free.app
```

Do not use `http://localhost:4000` for `PUBLIC_VOICE_BASE_URL`; Twilio must call the public HTTPS URL.

Then set Twilio credentials without writing real secrets into docs or committed files:

```bash
export VOICE_PROVIDER=twilio
export VOICE_CALLS_ENABLED=true
export VOICE_ALLOWED_TEST_NUMBERS=+37062071053
export TWILIO_ACCOUNT_SID=...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=...
# Recommended for Lithuanian record mode:
export VOICE_PROMPT_AUDIO_URL=https://your-cdn.example/lt-record-prompt.wav
```

Only the number in `VOICE_ALLOWED_TEST_NUMBERS` can be called. Supplier batch calls are intentionally disconnected and are not ready.

### Manual voice RPC smoke

From `/Users/Ryttis/mcp-bridge`, with `mcp-server` running:

```bash
node -e "import('./src/bridge/rpcClient.js').then(async ({rpcCallOnce}) => {
  const url = new URL(process.env.MCP_SERVER_URL || 'ws://localhost:4000');
  if (process.env.AUTH_TOKEN) url.searchParams.set('token', process.env.AUTH_TOKEN);
  const r = await rpcCallOnce({
    url: url.toString(),
    method: 'voice.outboundCall',
    params: {
      phoneNumber: '+37062071053',
      language: 'lt-LT',
      purpose: 'test_call',
      approved: true,
      script: {
        intro: 'Laba diena, cia MCP bandomasis skambutis.',
        questions: ['Prasome pasakyti: testas pavyko.'],
        closing: 'Aciu. Viso gero.'
      },
      gatherSpeech: true,
      record: false,
      metadata: { source: 'manual-smoke' }
    },
    timeoutMs: 60000
  });
  console.log(JSON.stringify(r, null, 2));
})"
```

Expected key fields: `{ "ok": true, "provider": "mock", "status": "mock_queued" }`.

### Real Twilio gather test call

When the Twilio env gates above are intentionally enabled for your own phone, the bridge command sends the default `responseMode="gather"` request:

```bash
cd /Users/Ryttis/mcp-bridge
node bridge.js voice-test-call --phone "+37062071053" --call --json
```

Expected key fields: `{ "ok": true, "provider": "twilio", "status": "queued", "responseMode": "gather" }` plus `providerCallSid`.

### Real Twilio record test call

Use the bridge response-mode flag for a real record-mode test:

```bash
cd /Users/Ryttis/mcp-bridge
node bridge.js voice-test-call --phone "+37062071053" --call --response-mode record --json
```

Expected key fields: `{ "ok": true, "provider": "twilio", "status": "queued", "responseMode": "record" }` plus `providerCallSid`.

### Check status/result

Use the `callId` returned by either test call:

```bash
cd /Users/Ryttis/mcp-bridge
node bridge.js voice-status --call-id "twilio-call-..." --json
node bridge.js voice-result --call-id "twilio-call-..." --json
node bridge.js voice-transcribe --call-id "twilio-call-..." --json
```

For `record` mode, `voice-result` can include:

```json
{
  "transcript": [
    {
      "source": "caller_recording",
      "recordingSid": "RE...",
      "recordingUrl": "https://api.twilio.com/...",
      "duration": "7",
      "text": null,
      "createdAt": "..."
    }
  ],
  "answers": [
    {
      "question": "Prasome pasakyti: testas pavyko.",
      "answer": null,
      "recordingUrl": "https://api.twilio.com/...",
      "recordingSid": "RE...",
      "transcriptionPending": true
    }
  ]
}
```

After OpenAI transcription, the same fields are updated with text:

```json
{
  "transcript": [{ "source": "caller_recording", "text": "testas pavyko" }],
  "answers": [{ "answer": "testas pavyko", "transcriptionPending": false }]
}
```

### Test public TwiML URL

After creating a call, verify that Twilio can reach the public TwiML route:

```bash
curl "$PUBLIC_VOICE_BASE_URL/voice/twilio/twiml?callId=twilio-call-..."
```

Gather mode should include `<Gather ...>`. Record mode should include `<Record ... action=".../voice/twilio/recording-result?callId=..." recordingStatusCallback=".../voice/twilio/recording-result?callId=...">`.
When `VOICE_PROMPT_AUDIO_URL` is set, record mode should also include `<Play>https://...</Play>` before `<Record>`.

### Troubleshooting

- Empty transcript in gather mode: Twilio did not return `SpeechResult`. Use `responseMode="record"` for Lithuanian testing and inspect `voice-result` for `recordings` or `transcriptionPending: true`.
- Empty transcript in record mode: this is expected while `VOICE_TRANSCRIPTION_PROVIDER=none`. Check for `caller_recording`, `RecordingUrl`, and `transcriptionPending: true`.
- OpenAI transcription returns `not_configured`: confirm `VOICE_TRANSCRIPTION_PROVIDER=openai`, `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID`, and `TWILIO_AUTH_TOKEN` are available to the server process.
- OpenAI transcription returns `missing_recording_url`: Twilio did not include `RecordingUrl`; wait for the completed recording callback or inspect the saved call record.
- No recording callback received: confirm `PUBLIC_VOICE_BASE_URL` is the current public HTTPS ngrok URL, the server is running, and the TwiML contains the absolute `/voice/twilio/recording-result` action URL.
- Ngrok URL changed: update `PUBLIC_VOICE_BASE_URL`, restart the server process if env vars are loaded at startup, then create a new call. Existing calls keep the old callback URL in their saved record.
- Twilio geo-permissions or caller ID issues: confirm the destination country is enabled in Twilio outbound geo-permissions and `TWILIO_FROM_NUMBER` is a valid Twilio caller ID for the account.

### Current limitations

- Lithuanian prompts should use recorded/native audio or high-quality generated audio through `VOICE_PROMPT_AUDIO_URL`. Twilio `<Say>` is only a fallback and still sounds poorly pronounced for Lithuanian.
- `voice.getCallResult` may show recording metadata with `transcriptionPending: true` until the recording has been transcribed.
- Supplier batch calls remain intentionally disconnected. Keep the manual, allowed-number-only test workflow.

---

## 🚨 Deprecations

_None._

---

## 📜 Invariants

- Tools must not perform unbounded filesystem access.
- All paths must respect allowed roots.
- All errors must be thrown as ToolError.
- No tool may depend on bridge or agent logic.

---

_End of v1 tool surface._

---

## MCP stdio adapter

`mcp-server` also provides a command-based MCP stdio entrypoint for local MCP clients:

```bash
node /Users/Ryttis/mcp-server/src/mcp/stdio-server.js
```

The stdio adapter exposes only the safe MCP-facing tool names below:

- `memory_ingest` -> `core.memoryIngest`
- `memory_query` -> `core.memoryQuery`
- `llm_complete` -> `core.llmComplete`

The stdio adapter intentionally does not expose `core.runCommand`, `core.writeFile`, `core.dbQuery`, `core.projectStatus`, or `core.snapshotServer`. `core.projectStatus` is excluded because its current IO layer executes the shell command `tree`. `scan_project` is not exposed because no safe non-mutating scan tool is currently available.

### Codex config example

Example `~/.codex/config.toml` or project `.codex/config.toml` entry:

```toml
[mcp_servers.ryttis]
command = "node"
args = ["/Users/Ryttis/mcp-server/src/mcp/stdio-server.js"]
env = { OPENAI_API_KEY = "REPLACE_ME", MEMORY_DATA_DIR = "/Users/Ryttis/mcp-memory/data/lance" }
```

Use placeholders only in committed config examples. Do not commit real secrets.

### Claude Code command example

Configure a command-based MCP server using:

```bash
node /Users/Ryttis/mcp-server/src/mcp/stdio-server.js
```

Provide `OPENAI_API_KEY` and any memory data path environment variables through the client configuration or shell environment when using LLM or memory tools. Server startup does not require `OPENAI_API_KEY`; missing credentials fail only the tool call that needs them.
