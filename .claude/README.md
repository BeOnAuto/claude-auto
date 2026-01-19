# Claude Code Hooks System

Automated guardrails and workflow automation for Claude Code sessions.

---

## Overview

This directory contains a hooks system that:
- **Protects files** from unauthorized LLM modifications (deny-list)
- **Validates commits** against CLAUDE.md rules before allowing them
- **Auto-continues** work when the LLM pauses with remaining tasks
- **Reminds** the LLM of guidelines on every prompt

All hooks are controlled via `/auto` commands and persist state in `state.json`.

---

## Quick Start

```bash
# View current hook status
/auto status

# Enable non-stop mode (auto-continue without asking)
/auto non-stop --max 10

# Switch back to smart mode (Claude decides)
/auto smart

# View logs in real-time
tail -f .claude/logs/*.log
```

---

## Architecture

```
.claude/
├── settings.json          # Hook registration (loaded at session start)
├── state.json             # Runtime state (controlled via /auto)
├── commands/
│   └── auto.md            # /auto command definition
├── scripts/
│   ├── session-start.ts   # Creates log file on session init
│   ├── prompt-reminder.ts # Injects reminders on each prompt
│   ├── deny-list.ts       # Blocks edits to protected files
│   ├── deny-list.txt      # Protected file patterns
│   ├── validate-commit.ts # Validates commits against CLAUDE.md
│   ├── auto-continue.ts   # Decides whether to continue or stop
│   └── lib/
│       ├── logger.ts      # Shared logging utilities
│       ├── state.ts       # State management
│       └── clue-collector.ts # Extracts signals from session logs
├── logs/
│   └── *.log              # Per-session log files
└── skills/
    └── *.md               # Reusable skill definitions
```

---

## Hooks Reference

### SessionStart

**Script:** `session-start.ts`

Creates a timestamped log file when a Claude Code session begins. Includes the path to the session's JSONL transcript for debugging.

**Log output:**
```
session: abc12345
tail -f ~/.claude/projects/-Users-sam-code-auto-1/abc12345-xxxx.jsonl
```

### UserPromptSubmit

**Script:** `prompt-reminder.ts`

Injects a reminder into every prompt submission. Reminds Claude to:
1. Follow CLAUDE.md guidelines
2. Stick to ketchup-plan.md if one exists
3. Work in controlled bursts
4. Ask before assuming backwards compatibility

**Control:**
```bash
/auto reminder off   # Disable
/auto reminder on    # Enable
```

### PreToolUse (Deny List)

**Script:** `deny-list.ts`
**Patterns:** `deny-list.txt`

Blocks Edit/Write/NotebookEdit operations on protected files. Patterns in `deny-list.txt` can be:
- Simple substrings: `secrets/`
- Regex patterns: `\.env$`
- Case-insensitive: `CLAUDE\.md$/i`

**Example deny-list.txt:**
```
.claude/scripts/
CLAUDE\.md$/i
\.env$
```

**Control:**
```bash
/auto deny off    # Disable file protection
/auto deny on     # Enable file protection
```

### PreToolUse (Commit Validation)

**Script:** `validate-commit.ts`

Intercepts `git commit` commands and validates staged changes against CLAUDE.md rules using Claude CLI.

**Modes:**
- `strict` (default): Block commits that violate rules
- `warn`: Log violations but allow commit
- `off`: Skip validation entirely

**Control:**
```bash
/auto commit strict   # Block on violations
/auto commit warn     # Warn but allow
/auto commit off      # Skip validation
```

### Stop (Auto-Continue)

**Script:** `auto-continue.ts`

When the LLM stops, this hook decides whether to auto-continue based on:
1. **Pattern matching** - "would you like to continue?", "remaining bursts"
2. **Ketchup plans** - Incomplete TODO items in `ketchup-plan.md`
3. **Claude CLI decision** - Smart analysis of session context

**Modes:**
- `smart` (default): Claude CLI decides based on session context
- `non-stop`: Always continue (with optional iteration limit)
- `off`: Never auto-continue

**Control:**
```bash
/auto smart              # Claude decides (default)
/auto non-stop           # Always continue
/auto non-stop --max 10  # Continue up to 10 times
/auto off                # Never auto-continue
```

---

## State Management

### State File

`state.json` stores runtime configuration for all hooks:

```json
{
  "autoContinue": {
    "mode": "smart",
    "maxIterations": 0,
    "iteration": 0
  },
  "validateCommit": {
    "mode": "strict"
  },
  "denyList": {
    "enabled": true,
    "extraPatterns": []
  },
  "promptReminder": {
    "enabled": true
  },
  "updatedAt": "2026-01-04T10:30:00.000Z",
  "updatedBy": "/auto status"
}
```

### /auto Commands

| Command | Description |
|---------|-------------|
| `/auto help` | Show all commands |
| `/auto status` | Show current state |
| `/auto non-stop [--max N]` | Always continue (N = iteration limit) |
| `/auto smart` | Claude decides when to continue |
| `/auto off` | Never auto-continue |
| `/auto commit strict\|warn\|off` | Commit validation mode |
| `/auto deny on\|off` | Enable/disable file protection |
| `/auto reminder on\|off` | Enable/disable prompt reminder |
| `/auto reset` | Reset all to defaults |

### CLI Access

You can also manage state directly:

```bash
# View state
npx tsx .claude/scripts/lib/state.ts status

# Reset to defaults
npx tsx .claude/scripts/lib/state.ts reset
```

---

## Logs

### Location

Logs are stored in `.claude/logs/` with filenames like:
```
abc12345-2026-01-04T10-30-00.log
```

The prefix is the first 8 characters of the session ID.

### Viewing Logs

```bash
# Real-time log streaming
tail -f .claude/logs/*.log

# View errors only
tail -f .claude/logs/err.log

# Watch specific session
tail -f .claude/logs/abc12345*.log
```

### Log Levels

| Level | Color | Meaning |
|-------|-------|---------|
| `ACK` | Green | Commit validated successfully |
| `NACK` | Red | Commit blocked due to violation |
| `CONTINUE` | Cyan | Auto-continuing work |
| `DENIED` | Magenta | File edit blocked |
| `SKIP` | Yellow | Hook skipped (disabled or not applicable) |
| `INFO` | Dim | Informational message |
| `ERROR` | Red | Error occurred |

### Sample Log Output

```
[2026-01-04T10:30:00.000Z] INFO: Validating commit in: /Users/sam/code/auto (mode=strict)
[2026-01-04T10:30:01.500Z] ACK: src/index.ts, src/utils.ts
[2026-01-04T10:31:00.000Z] CONTINUE: Remaining bursts in ketchup-plan.md
```

---

## Testing & Debugging

### Test Clue Collector

The clue collector extracts signals from session logs. Test it standalone:

```bash
# Find your session transcript
SESSION_PATH=~/.claude/projects/-Users-sam-code-auto-1/<session_id>.jsonl

# Run clue collector
npx tsx .claude/scripts/lib/clue-collector.ts "$SESSION_PATH"
```

Output shows:
- Pattern matches ("would you like to continue?")
- Ketchup mentions
- Plan references
- Last 5 chat exchanges

### Test Validate Commit

Simulate a commit validation:

```bash
# Stage some files
git add -A

# Run validator manually (reads from stdin)
echo '{"tool_input":{"command":"git commit -m test"},"cwd":"'$(pwd)'"}' | \
  npx tsx .claude/scripts/validate-commit.ts
```

### Test Deny List

Check if a file would be blocked:

```bash
echo '{"tool_input":{"file_path":".claude/scripts/test.ts"}}' | \
  npx tsx .claude/scripts/deny-list.ts
```

### Debug Session Transcripts

Claude Code stores session transcripts as JSONL:

```bash
# Location pattern
~/.claude/projects/<PROJECT_SLUG>/<SESSION_ID>.jsonl

# Stream live
tail -f ~/.claude/projects/-Users-sam-code-auto-1/*.jsonl | jq .

# Extract assistant messages
cat ~/.claude/projects/-Users-sam-code-auto-1/*.jsonl | \
  jq -r 'select(.type=="assistant") | .message.content[0].text'
```

---

## Customization

### Add Protected Files

Edit `.claude/scripts/deny-list.txt`:

```
# Block all .env files
\.env$

# Block entire directory
secrets/

# Case-insensitive match
IMPORTANT\.md$/i
```

### Add Extra Patterns via State

```bash
# Add patterns without editing deny-list.txt
# (modify state.json directly or via /auto command)
```

### Customize Prompt Reminder

Edit `prompt-reminder.ts` to change the injected reminder text.

### Tune Continue Patterns

Edit `lib/clue-collector.ts` to add/modify `CONTINUE_PATTERNS`:

```typescript
export const CONTINUE_PATTERNS = [
  /would you like (?:me )?to continue/i,
  /shall I (?:continue|proceed)/i,
  // Add your patterns here
];
```

---

## Troubleshooting

### Hooks Not Running

Hooks are loaded at session start. If you modify `settings.json`:
1. Exit the current Claude Code session
2. Start a new session

### "Command not found: claude"

The `validate-commit.ts` and `auto-continue.ts` scripts use Claude CLI. Ensure it's installed:

```bash
npm install -g @anthropic-ai/claude-code
```

### State File Not Found

The state file is auto-created on first access. If missing, run:

```bash
npx tsx .claude/scripts/lib/state.ts status
```

### Logs Not Appearing

Check that:
1. Session started after hooks were added to `settings.json`
2. Log directory exists: `ls -la .claude/logs/`
3. Session ID is being passed to hooks

---

## Files Reference

| File | Purpose |
|------|---------|
| `settings.json` | Registers hooks with Claude Code |
| `state.json` | Runtime configuration |
| `commands/auto.md` | `/auto` command definition |
| `scripts/session-start.ts` | Creates session log file |
| `scripts/prompt-reminder.ts` | Injects prompt reminders |
| `scripts/deny-list.ts` | Blocks protected file edits |
| `scripts/deny-list.txt` | Protected file patterns |
| `scripts/validate-commit.ts` | Validates commits |
| `scripts/auto-continue.ts` | Auto-continue decision |
| `scripts/lib/logger.ts` | Shared logging utilities |
| `scripts/lib/state.ts` | State management |
| `scripts/lib/clue-collector.ts` | Session log analysis |
