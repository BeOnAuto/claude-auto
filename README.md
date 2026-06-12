# Ketchup

**Turn every AI mistake into a rule AI can't repeat.**

Ketchup runs 20+ LLM-powered guardrails on every AI commit, so bad commits don't land.

[![Build](https://img.shields.io/github/actions/workflow/status/BeOnAuto/ketchup/ci.yml?style=flat-square)](https://github.com/BeOnAuto/ketchup/actions) [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)]()

```
/plugin install ketchup
```

*Ketchup is an open-source guardrail engine for Claude Code, from the team at [Auto](https://on.auto).*

> Today: Claude Code only. If your agent exposes hooks or an equivalent integration surface, [open an issue](https://github.com/BeOnAuto/ketchup/issues).

---

## Why

AI coding agents have three problems: they're biased for delivery, they have no negative knowledge about your system, and every prompt is a clean slate that forgets yesterday's lessons. Static tools (eslint, husky, commitlint) can't catch semantic failures: a test that asserts nothing, a commit that bundles three unrelated concerns, a "fix" that rationalizes a shortcut, an architectural rule violated three months after you wrote it.

Ketchup runs a separate Claude subagent against every commit, with your rules as its context and no investment in whether the commit ships. When it finds a violation, it blocks the commit and tells you why.

The workflow is: observe an AI mistake, encode it as a rule, AI can't repeat it. The codebase gets permanently safer as you keep working, not just temporarily cleaner. See [Guardrail Engineering](./docs/guardrail-engineering.md) for the mechanism and [the Ketchup Technique](./docs/ketchup-technique.md) for the planning rhythm that feeds clean work into it.

## In the stack

Ketchup comes from the team building [Auto](https://on.auto), a spec-driven development platform: Auto decides what to build, and Ketchup enforces how. Use them together or use Ketchup on its own; both work.

## Key Concepts

- **Hooks**: Three integration points (SessionStart, PreToolUse, UserPromptSubmit) that let Ketchup observe and gate Claude Code's behavior
- **Validators**: Markdown files with YAML frontmatter that ACK or NACK commits based on your criteria
- **Reminders**: Context-injection files that surface your guidelines at the right moment
- **Deny-list**: Glob patterns that protect files from modification
- **TCR Discipline**: Test && Commit || Revert, so bad code auto-reverts
- **Parallel subagent planning**: `ketchup-plan.md` carries dependency notation so independent bursts launch in parallel sub-agents

---

## Installation

### From the Marketplace (recommended)

Inside any Claude Code session:

```
/plugin marketplace add BeOnAuto/auto-plugins
/plugin install ketchup
```

### As a Local Plugin

```bash
claude --plugin-dir /path/to/ketchup
```

Claude Code sets `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA` automatically. Run `/ketchup:init` inside a session to activate per-project configuration, validators, and logging.

## Quick Start

```bash
# Marketplace (inside Claude Code)
/plugin marketplace add BeOnAuto/auto-plugins
/plugin install ketchup

# Or local plugin mode
claude --plugin-dir /path/to/ketchup
```

After installation, Claude will mention that Ketchup is available. To activate it in a project:

```
/ketchup:init
```

This creates `.ketchup/` with default configuration. You can add it to `.gitignore` for personal use, or commit it for the whole team.

If you're upgrading from `claude-auto`, your existing `.claude-auto/` directory will be auto-renamed to `.ketchup/` on first session-start. No manual action required.

**Next steps:**

- [Getting Started guide](./docs/getting-started.md)
- [The Ketchup Technique](./docs/ketchup-technique.md)
- [In the Stack](./docs/in-the-stack.md)

---

## Events Viewer

Ketchup ships with a local web UI that streams every Claude Code event from the current repository in real time — prompts, thoughts, tool invocations and their results, hook executions, file edits, and session boundaries — as a collapsible tree per session.

```
/ketchup:view        # boot the viewer (auto-picks first free port from 4321 up)
/ketchup:view-stop   # stop the viewer running for this repo
```

Open the URL it prints (default `http://127.0.0.1:4321`) in your browser. Light/dark themes with a toggle in the sidebar (choice persisted), selected session highlighted, auto-scroll to bottom on new events when pinned.

**How it works:**

- Reads `~/.claude/projects/<dashed-cwd>/*.jsonl` transcripts, translates each line into a domain event, and appends to a SQLite store via `@event-driven-io/emmett-sqlite`
- Watches the transcript directory with `fs.watch`; new lines are ingested within ~15 ms and pushed over WebSocket to any connected tab — no polling
- Serves the built SPA and the API from a single Express port so the viewer is one process, one URL
- The repository name shown in the sidebar is derived from the cwd the viewer was launched in

**Multiple repositories:**

Running `/ketchup:view` in a second repo starts a second viewer on the next free port (4322, 4323, …). Each viewer watches its own repo's transcripts. They do not share state.

**Auto-stop:**

The viewer exits on its own after 30 minutes with no connected clients — close all browser tabs and the process cleans itself up. Override with the `KETCHUP_VIEW_IDLE_MINUTES` env var. `/ketchup:view-stop` kills every running viewer immediately.

---

## Custom Validators and Reminders

Add project-specific rules by creating markdown files in `.ketchup/validators/` and `.ketchup/reminders/`.

### Custom Validator

Create `.ketchup/validators/my-rule.md`:

```markdown
---
name: my-rule
description: Enforce my custom rule
enabled: true
---

You are validating a git commit. Check that [your criteria here].

Respond with JSON only:
- If the commit passes: {"decision":"ACK"}
- If the commit fails: {"decision":"NACK","reason":"explanation"}
```

Validators receive the staged diff, file list, and commit message. They must return ACK or NACK as JSON.

### Custom Reminder

Create `.ketchup/reminders/my-reminder.md`:

```markdown
---
when:
  hook: UserPromptSubmit
priority: 50
---

Your reminder content here. This gets injected on every prompt.
```

The `when` field controls when the reminder fires:

| Condition | Fires when |
|-----------|-----------|
| `hook: SessionStart` | Once at session start |
| `hook: UserPromptSubmit` | Every user prompt |
| `hook: PreToolUse` | Before tool execution |
| `hook: PreToolUse` + `toolName: Bash` | Only before Bash tool |
| _(no `when`)_ | All hooks |

Higher `priority` = appears first. Project-local files are loaded alongside plugin defaults. If filenames collide, plugin versions take precedence.

### Runtime Configuration

Toggle validators and reminders without editing files:

```bash
/ketchup:config show
/ketchup:config validators disable no-comments
/ketchup:config reminders priority my-reminder 200
/ketchup:config reminders add my-rule --hook UserPromptSubmit --priority 50 --content "Always use early returns"
```

---

### Multiply with Git Worktrees

```bash
git worktree add ../feature-auth feature/auth
git worktree add ../feature-payments feature/payments
```

Each worktree runs its own Ketchup instance, all quality-validated.

---

### Configuration

```json
{
  "validateCommit": { "mode": "strict", "batchCount": 3 },
  "denyList": { "enabled": true },
  "promptReminder": { "enabled": true },
  "subagentHooks": {
    "validateCommitOnExplore": false,
    "validateCommitOnWork": true,
    "validateCommitOnUnknown": true
  }
}
```

Configuration lives in `.ketchup/state.json`. See the [Configuration guide](./docs/configuration.md) for all options.

---

## How It Works

```mermaid
flowchart LR
    A[Claude Code] --> B[Hook Scripts]
    B --> C{Hook Type}
    C -->|SessionStart| D[Load Reminders]
    C -->|PreToolUse| E[Validate Commits + Deny-list]
    C -->|UserPromptSubmit| F[Inject Reminders]
    E -->|ACK| H[Allow]
    E -->|NACK| I[Block + Revert]
```

Hook scripts read JSON from stdin, delegate to handlers in `src/hooks/`, log results, and output JSON to stdout. Validators are batched (default 3 per Claude CLI call) for efficient parallel validation. Reminders are matched by hook type, mode, and tool name, then injected as `<system-reminder>` blocks.

---

## Roadmap

Ketchup is Claude Code-first today. The Ketchup Technique (the methodology) works with any AI coding agent by hand. If your agent exposes hooks or an equivalent integration surface, [open an issue](https://github.com/BeOnAuto/ketchup/issues) so we can scope adapter work.

---

## Troubleshooting

### Hooks Not Firing

**Symptom:** Commits go through without validation.

**Cause:** Plugin not installed or not enabled.

**Solution:**

```
/plugin install ketchup
```

### Enable Debug Logging

```bash
DEBUG=ketchup claude --plugin-dir /path/to/ketchup
```

`DEBUG=ketchup` writes diagnostics to `.ketchup/logs/ketchup/debug.log`.

---

## Documentation

| Guide | Description |
| ----- | ----------- |
| [Getting Started](./docs/getting-started.md) | First-time setup and core concepts |
| [Installation](./docs/installation.md) | Detailed installation guide |
| [The Ketchup Technique](./docs/ketchup-technique.md) | The planning methodology |
| [In the Stack](./docs/in-the-stack.md) | How Ketchup fits with Auto and spec-driven development |
| [Configuration](./docs/configuration.md) | All configuration options |
| [Hooks Guide](./docs/hooks-guide.md) | Hook system deep-dive |
| [Reminders Guide](./docs/reminders-guide.md) | Context injection system |
| [Validators Guide](./docs/validators-guide.md) | Commit validation rules |
| [Architecture](./docs/architecture.md) | System design internals |
| [Origin Story](./docs/origin-story.md) | How Ketchup came to be |

---

## Architecture

```
.claude-plugin/
└── plugin.json           # Plugin manifest (name, version, description)
hooks/
└── hooks.json            # Plugin hook definitions (SessionStart, PreToolUse, etc.)
validators/               # Default commit validators
reminders/                # Default context-injection reminders (10 files)
agents/                   # Sub-agent definitions (validator agent)
src/
├── brand.ts              # BRAND constants (single source of truth for naming)
├── hooks/                # Hook handlers (session-start, pre-tool-use, user-prompt-submit)
├── migrate.ts            # .claude-auto -> .ketchup auto-migration
├── path-resolver.ts      # Plugin-mode path resolution
├── commit-validator.ts   # Batched commit validation with appeal support
├── deny-list.ts          # File protection via micromatch patterns
├── reminder-loader.ts    # Multi-directory reminder system with deduplication
├── hook-state.ts         # Hook state management (state.json)
├── validator-loader.ts   # Multi-directory validator loader
└── index.ts              # Public API barrel exports
scripts/
├── session-start.ts      # SessionStart hook entry-point (runs migration first)
├── pre-tool-use.ts       # PreToolUse hook entry-point
└── user-prompt-submit.ts # UserPromptSubmit hook entry-point
```

### Dependencies

| Package | Usage |
| ------- | ----- |
| gray-matter | YAML frontmatter parsing for validators and reminders |
| micromatch | Glob pattern matching for deny-lists |

---

## Development

### Prerequisites

- Node.js 18+
- pnpm 10+

### Setup

```bash
git clone https://github.com/BeOnAuto/ketchup.git
cd ketchup
pnpm install
pnpm build
```

### Commands

| Command | Description |
| ------- | ----------- |
| `pnpm build` | TypeScript compile + esbuild bundle scripts |
| `pnpm test` | Run all tests (vitest) |
| `pnpm type-check` | TypeScript type checking |
| `pnpm lint` | Biome lint check |
| `pnpm check` | Full CI: build + type-check + test + lint |

---

## License

MIT &copy; 2025 BeOnAuto, Inc.

See [LICENSE](LICENSE) for details.
