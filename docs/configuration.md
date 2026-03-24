# Configuration Reference

Complete reference for all Claude Auto configuration options, files, and environment variables.

---

## Configuration Files Overview

Claude Auto uses a layered configuration system with multiple files:

| File | Purpose | Committed? | Auto-Created? |
|------|---------|------------|---------------|
| `.claude-auto/.claude.hooks.json` | Primary runtime hook state | No | Yes |
| `.claude/deny-list.project.txt` | Project file protection | Yes | No |
| `.claude/deny-list.local.txt` | Local file protection | No | No |
| `.claude-auto/reminders/*.md` | Context injection reminders | Yes/No | Yes |
| `.claude-auto/validators/*.md` | Commit validation rules | Yes/No | Yes |

---

## Hook State (`.claude-auto/.claude.hooks.json`)

The primary runtime configuration file. Controls auto-continue, commit validation, and other behaviors.

**Location:** `.claude-auto/.claude.hooks.json` (inside the claude-auto directory)

### Full Schema

```json
{
  "autoContinue": {
    "mode": "smart",
    "maxIterations": 0,
    "iteration": 0,
    "skipModes": ["plan"]
  },
  "validateCommit": {
    "mode": "strict"
  },
  "denyList": {
    "enabled": true,
    "extraPatterns": []
  },
  "promptReminder": {
    "enabled": true,
    "customReminder": ""
  },
  "subagentHooks": {
    "validateCommitOnExplore": false,
    "validateCommitOnWork": true,
    "validateCommitOnUnknown": true
  },
  "updatedAt": "2026-01-21T00:00:00.000Z",
  "updatedBy": "init"
}
```

### `autoContinue`

Controls automatic continuation after Claude stops.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `'smart' \| 'non-stop' \| 'off'` | `'smart'` | Continuation strategy |
| `maxIterations` | `number` | `0` | Max iterations (0 = unlimited) |
| `iteration` | `number` | `0` | Current iteration count |
| `skipModes` | `string[]` | `['plan']` | Modes that skip auto-continue |

**Mode behaviors:**

| Mode | Behavior |
|------|----------|
| `smart` | Analyzes transcript for continuation signals before deciding |
| `non-stop` | Always continues until `maxIterations` reached |
| `off` | Never auto-continues |

### `validateCommit`

Controls commit validation against project rules.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `'strict' \| 'warn' \| 'off'` | `'strict'` | Validation strictness |

**Mode behaviors:**

| Mode | Behavior |
|------|----------|
| `strict` | Blocks commits that violate rules (NACK) |
| `warn` | Warns but allows commits |
| `off` | No commit validation |

### `denyList`

Controls file protection.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable deny-list |
| `extraPatterns` | `string[]` | `[]` | Additional patterns beyond files |

### `promptReminder`

Controls prompt injection.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable reminders |
| `customReminder` | `string` | `''` | Custom text to inject |

### `subagentHooks`

Controls which subagent types trigger validation hooks.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `validateCommitOnExplore` | `boolean` | `false` | Validate explore agents |
| `validateCommitOnWork` | `boolean` | `true` | Validate work agents |
| `validateCommitOnUnknown` | `boolean` | `true` | Validate unknown agents |

---

---

## Deny-List Files

Protect files from AI modification using glob patterns.

See the [Hooks Guide](/hooks-guide#protect-files-with-deny-list) for detailed deny-list setup and pattern syntax.

### Quick Reference

- **`.claude/deny-list.project.txt`** - Project-wide patterns (committed to repo)
- **`.claude/deny-list.local.txt`** - Personal patterns (gitignored)

Patterns use [micromatch](https://github.com/micromatch/micromatch) glob syntax.

---

## Managing Configuration

Configuration is managed via the `/claude-auto:config` skill from within a Claude Code session:

```
/claude-auto:config show          # View current configuration
/claude-auto:config set <key> <value>  # Update a setting
/claude-auto:config validators    # List active validators
/claude-auto:config reminders     # List active reminders
```

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `AUTO_ROOT` | Force project root path | Auto-detected |
| `INIT_CWD` | Starting directory for root search | `process.cwd()` |
| `DEBUG` | Enable debug logging | - |
| `AUTO_LOG` | Filter activity logging | Log everything |
| `CI` | Detect CI environment | - |
| `AUTO_VALIDATOR_MODE` | Override validator mode | From config |
| `AUTO_AUTO_CONTINUE` | Override auto-continue mode | From config |

### `AUTO_ROOT`

Override automatic project root detection:

```bash
AUTO_ROOT=/path/to/project claude
```

### `DEBUG`

Enable debug logging:

```bash
DEBUG=claude-auto* claude
```

Logs written to `.claude-auto/logs/debug.log`.

### `AUTO_LOG`

Filter activity logging by hook name or pattern:

```bash
# Only log session-start hook
AUTO_LOG="session-start" claude

# Log everything except 'allowed' messages
AUTO_LOG="*,-allowed" claude

# Log multiple specific patterns
AUTO_LOG="session-start,block" claude
```

Activity logs written to `.claude-auto/logs/activity.log`.

### `AUTO_VALIDATOR_MODE`

Override the commit validation mode at runtime:

```bash
# Temporarily disable validation
AUTO_VALIDATOR_MODE=off claude

# Force strict validation
AUTO_VALIDATOR_MODE=strict claude

# Use warning mode
AUTO_VALIDATOR_MODE=warn claude
```

Overrides the `validateCommit.mode` setting in `.claude-auto/.claude.hooks.json`.

### `AUTO_AUTO_CONTINUE`

Override the auto-continue mode at runtime:

```bash
# Enable non-stop mode
AUTO_AUTO_CONTINUE=non-stop claude

# Use smart mode
AUTO_AUTO_CONTINUE=smart claude

# Disable auto-continue
AUTO_AUTO_CONTINUE=off claude
```

Overrides the `autoContinue.mode` setting in `.claude-auto/.claude.hooks.json`.

---

## State File (`.claude/state.json`)

Optional file for conditional skill/reminder loading.

### Example

```json
{
  "projectType": "typescript",
  "framework": "express",
  "testFramework": "vitest"
}
```

### Usage in Reminders

Reminders can conditionally load based on state:

```yaml
---
when:
  hook: SessionStart
  projectType: typescript
  framework: express
priority: 50
---

# Express TypeScript Guidelines

...
```

All conditions must match (AND logic).

---

## Reminder Frontmatter

Reminders are Markdown files with YAML frontmatter that inject context into Claude sessions.

### Location

- Default reminders: `.claude-auto/reminders/` (provided by plugin)
- Custom reminders: `.claude-auto/reminders/` (add your own `.md` files)

### Frontmatter Schema

```yaml
---
when:
  hook: SessionStart        # Which hook triggers this
  mode: plan               # Optional: 'plan' or 'code'
priority: 100              # Optional: Order (higher = earlier)
---
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `when.hook` | `string` | Required | `SessionStart` or `UserPromptSubmit` |
| `when.mode` | `string` | - | Filter by mode: `plan` or `code` |
| `priority` | `number` | `0` | Execution order (higher first) |

---

## Validator Frontmatter

Validators are Markdown files with YAML frontmatter.

### Location

- Default validators: `.claude-auto/validators/` (provided by plugin)
- Custom validators: `.claude-auto/validators/` (add your own `.md` files)

### Frontmatter Schema

```yaml
---
name: my-validator          # Unique identifier
description: What it validates
enabled: true              # Set to false to disable
---
```

---

## Project Root Detection

Claude Auto finds the project root in this order:

1. `AUTO_ROOT` environment variable (if set and path exists)
2. Walk up from `INIT_CWD` or `process.cwd()` to find `package.json`
3. Walk up to find `.git` directory
4. Fall back to `process.cwd()`

---

## Logging Configuration

### Debug Logs

**Location:** `.claude-auto/logs/debug.log`

**Enable:** `DEBUG=claude-auto*`

**Format:** Timestamp, hook name, debug message

### Activity Logs

**Location:** `.claude-auto/logs/activity.log`

**Filter:** `AUTO_LOG` environment variable

**Format:** `MM-DD HH:MM:SS [session-id] hook-name: message`

**Levels:** ACK, NACK, ERROR, WARN, SKIP, INFO, DENIED, CONTINUE

---

## Quick Reference

### Disable all hooks locally

```json
// .claude/settings.local.json
{
  "hooks": {
    "SessionStart": { "_mode": "replace", "_value": [] },
    "PreToolUse": { "_mode": "replace", "_value": [] },
    "UserPromptSubmit": { "_mode": "replace", "_value": [] },
    "Stop": { "_mode": "replace", "_value": [] }
  }
}
```

::: tip Hook Scripts
Hook scripts are bundled within the plugin and registered automatically. No manual script setup is needed.
:::

### Enable non-stop mode

```json
// .claude-auto/.claude.hooks.json
{
  "autoContinue": {
    "mode": "non-stop",
    "maxIterations": 50
  }
}
```

### Disable commit validation

```json
// .claude-auto/.claude.hooks.json
{
  "validateCommit": {
    "mode": "off"
  }
}
```

### Add custom file protection

```json
// .claude-auto/.claude.hooks.json
{
  "denyList": {
    "enabled": true,
    "extraPatterns": ["*.generated.ts", "migrations/**"]
  }
}
```

### Skip validation for explore agents

```json
// .claude-auto/.claude.hooks.json
{
  "subagentHooks": {
    "validateCommitOnExplore": false,
    "validateCommitOnWork": true,
    "validateCommitOnUnknown": true
  }
}
```
