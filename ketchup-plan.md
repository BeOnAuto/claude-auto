# Ketchup Plan: Event Store — ingestion and tree viewer

Translate `~/.claude/projects/**/*.jsonl` transcripts into a domain event stream
stored in Emmett (SQLite backend). One stream per `sessionId`. Events preserve
interleave by order; raw jsonl line is stashed on each event under `source`.

**Phase 1 — Ingestion (done):** parsers, translator, ingester, CLI + Stop hook.

**Phase 2 — Viewer (done):** Express server + Vite/React SPA rendering a
tree of events per session. Session picker in left pane, tree in right pane.
Live updates via polling. Self-contained bundle so a future IDE webview can
embed the same assets.

**Phase 3 — Viewer polish (in progress):** chat-bubble framing for
prompt/response, compact tool cards with inline results, collapsed thoughts.
Built on Tailwind + shadcn/ui primitives.

**Design decisions (locked):**

- Domain-first vocabulary (noise types folded or dropped; raw line kept on `source`)
- SQLite backend via `@event-driven-io/emmett-sqlite`
- `ThoughtRecorded` events kept (privacy revisit later if needed)
- `AssistantResponded` emitted per text segment (interleave preserved by order)
- Ingestion: on-demand CLI + Stop hook piggyback (live tail deferred)
- Viewer server: Express, bound to `127.0.0.1`, no auth (local only)
- Viewer client: Vite + React SPA, self-contained for IDE webview embedding
- Live: server polls SQLite every ~500ms and pushes new events over SSE
- Tree: subagent spawn/completion pairs drive nesting; deep branches auto-collapsed

**Event vocabulary:**
`SessionStarted` · `PromptSubmitted` · `AssistantResponded` · `ThoughtRecorded` ·
`ToolInvoked` · `ToolInvocationSucceeded` · `ToolInvocationFailed` ·
`FileModified` · `HookExecuted` · `SubagentSpawned` · `SubagentCompleted` ·
`SessionCompacted` · `SessionEnded`

## TODO


## DONE

- [x] Burst 1: `parseSessionStarted` — jsonl `SessionStart` progress line → `SessionStarted` event (a31a987)
- [x] Burst 2: `parsePromptSubmitted` — `user` message line → `PromptSubmitted` event (a4b48d5)
- [x] Burst 3: `parseAssistantResponded` — `assistant` text segment → `AssistantResponded` event (651a361)
- [x] Burst 4: `parseThoughtRecorded` — `thinking` item → `ThoughtRecorded` event (b443876)
- [x] Burst 5: `parseToolInvoked` — `tool_use` item → `ToolInvoked` event (4f53bae)
- [x] Burst 8: `parseHookExecuted` — `hook_progress` line → `HookExecuted` event (1380fa5)
- [x] Burst 9: `parseSubagentProgressed` — `agent_progress` line → `SubagentProgressed` event (19ca15c)
- [x] Burst 10: `parseFileModified` — `tool_result` line with `create`/`update` → `FileModified` event (98e01a6)
- [x] Burst 6: `parseToolInvocationSucceeded` — successful `tool_result` → event (d0d02d3)
- [x] Burst 7: `parseToolInvocationFailed` — failed `tool_result` → event (1bde829)
- [x] Burst 11: `parseSessionEnded` — Stop hook line → `SessionEnded` event (39b6598)
- [x] Burst 13: `createEventStore` — Emmett SQLite store factory (183e82b)
- [x] Refactor: `parseSessionStarted` returns array with hook_progress filter (4080c31)
- [x] Burst 12: `translateSession` orchestrates parsers over jsonl lines (8f9f2c5)
- [x] Burst 14: `ingestSession` appends translated events to per-session stream (222ebba)
- [x] Burst 15: `ingestProject` invokes session ingester for each jsonl file (145d11d)
- [x] Burst 16: `ingestCliRun` + `scripts/events-ingest.ts` CLI entry (0e42410)
- [x] Burst 17: `ingestOnStop` wires Stop hook input to session ingestion (45ffc39)
- [x] Burst 18: `listSessions` returns per-session summaries from event store (f5c225c)
- [x] Burst 19: `readSessionEvents` returns domain events for a session stream (fa2a662)
- [x] Burst 20: `createViewerApp` serves `/api/sessions` from injected lister (7cfc9ad)
- [x] Burst 21: Viewer serves `/api/sessions/:id/events` from injected reader (38f74fd)
- [x] Burst 22: Scaffold `viewer/` workspace with vite, react, and testing-library (15a1ad9)
- [x] Burst 23: `startViewerServer` binds Express app on 127.0.0.1 (f4ca05e)
- [x] Burst 24: `scripts/events-viewer.ts` boots viewer server with SQLite deps (31dff51)
- [x] Burst 25: Session picker component fetches and lists sessions (a835e67)
- [x] Burst 26: Timeline component fetches events for a session (620bcec)
- [x] Burst 27: Timeline renders per-event-type summary with truncation (533d069)
- [x] Burst 28: `buildEventTree` pairs tool/result and subagent parents (0f5d303)
- [x] Burst 29: Timeline renders nested tree with depth attribute (1fa5d29)
- [x] Burst 30: Tree branches toggle collapsed/expanded via button (a2c088b)
- [x] Burst 31: Timeline polls events on interval for live updates (71cdc47)
- [x] Burst 32: Install tailwind css v4 in viewer and apply utility classes (a0ee174)
- [x] Burst 33: Add cn helper with clsx and tailwind-merge (b1904c7)
- [x] Burst 34: Render prompts as right-aligned chat bubbles (6ed0c71)
- [x] Burst 35: Render assistant responses as left-aligned chat bubbles (0981585)
- [x] Burst 36: Render thoughts as collapsed disclosure cards (003ff86)
- [x] Burst 37: Render tool invocations as cards with name and JSON input (37951a4)
- [x] Burst 38: Render hook/file/session events as compact metadata rows (8ab7795)
- [x] Burst 39: Restyle session picker as cards (4864470)
- [x] Burst 40: Tree branches start collapsed by default (8d897b7)
- [x] Burst 41: Move collapse toggle inside tool card header (eebd42a)
- [x] Burst 42: Constrain main and tool card input to prevent horizontal overflow (86d86f4)
- [x] Burst 43: Omit thought events with empty thinking text (7c5921e)
- [x] Burst 44: Render tool results with full content (bc6a37a)
- [x] Burst 45: Session picker renders localized last-timestamp (c12f943)
- [x] Burst 46: List sessions include summary from first prompt (49c1d33)
- [x] Burst 47: Session header shows id and summary above timeline (87edade)
- [x] Burst 48: Session picker uses summary as primary label (8b986d0)
- [x] Burst 49: Session header label and copy resume command button (018c4fd)
- [x] Burst 50: Dedupe events by source uuid when re-ingesting a session (a917054)
- [x] Burst 51: Events viewer re-ingests project dir on interval (c0bbf6b)
- [x] Burst 52: `deriveProjectDir` maps cwd to `~/.claude/projects/<dashed>` default
- [x] Burst 53: Viewer server serves built SPA assets from staticDir on same port
- [x] Burst 54: `/claude-auto-view` skill boots the bundled events viewer
- [x] Burst 55: `createEventWebSocket` sends initial event snapshot on ws connect
- [x] Burst 56: `wsHandle.publish` broadcasts events to the matching session's subscribers
- [x] Burst 56b: `ingestSession` returns the newly appended events for broadcasting
- [x] Burst 56c: Events viewer script publishes appended events to ws subscribers
- [x] Burst 57: Timeline subscribes via WebSocket and drops the polling interval
- [x] Burst 58: `watchProject` replaces the ingest setInterval with fs.watch-driven ingest
- [x] Burst 59: Vite dev proxy forwards `/ws` to Express for live events in dev mode
- [x] Burst 60: Viewer App shell renders on the Ketchup dark brand tokens
- [x] Burst 61: App title renders with the Ketchup rainbow gradient
- [x] Burst 62: SessionPicker renders cards on Ketchup dark surface tokens
- [x] Burst 63: SessionHeader adopts Ketchup dark tokens and pill-shaped copy button
- [x] Burst 64: Timeline event variants adopt Ketchup dark theme tokens
- [x] Burst 65: Viewer has a `ThemeToggle` that flips dark class on html and persists choice
- [x] Burst 66: App shell uses light defaults and dark overrides via Tailwind `dark:` variants
- [x] Burst 67: SessionPicker uses light defaults with dark overrides
- [x] Burst 68: SessionHeader uses light defaults with dark overrides
- [x] Burst 69: Timeline bubbles keep light palette and flip to dark-gray/near-white in dark mode
- [x] Burst 70: Floating round chevron "scroll to bottom" button appears when content is below the fold
- [x] Burst 71: Timeline auto-scrolls to bottom when new events arrive while pinned
- [x] Burst 72: Sidebar is sticky full-height and scrolls independently of the main pane
- [x] Burst 73: Selected session is highlighted with a brand-colored ring in the picker
- [x] Burst 74: `parsePromptSubmitted` surfaces queued_command attachments as prompt events
- [x] Burst 75: Selected-session ring uses `ring-inset` so it is not clipped by sidebar overflow
- [x] Burst 76: ScrollToBottomButton centers under the main pane using calc(50% + 10.5rem)
- [x] Burst 77: Clickable buttons and cards get `cursor-pointer` affordance
- [x] Burst 78: Shell caps at 100vh and main pane scrolls internally; sidebar stays full height
- [x] Burst 79: Chevron click is instant; Timeline auto-scroll is instant on first load, smooth after
- [x] Burst 80: Viewer server exposes `/api/project` with the configured project name
- [x] Burst 81: Sidebar shows the repository name above the Ketchup Viewer title
- [x] Burst 82: `/ketchup:view-stop` skill kills the running events viewer via pkill
- [x] Burst 83: Viewer picks the first free port so multiple repos can run side-by-side
- [x] Burst 84: Viewer auto-exits after idle timeout with no clients + README documents the viewer
- [x] Burst 85: ThemeToggle uses light defaults so hover is subtle slate-50 in light mode
- [x] Burst 86: Skill frontmatter names prefixed with `ketchup-` so commands are `/ketchup:view` etc.
