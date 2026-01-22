# Configuration Reference

Complete reference for all Ketchup configuration options, files, and environment variables.

---

## Configuration Files Overview

Ketchup uses a layered configuration system with multiple files:

| File | Purpose | Committed? | Auto-Created? |
|------|---------|------------|---------------|
| `.claude.hooks.json` | Runtime hook state | No | Yes |
| `.claude/settings.json` | Merged hook configuration | No | Yes |
| `.claude/settings.project.json` | Project-level overrides | Yes | No |
| `.claude/settings.local.json` | Local/personal overrides | No | No |
| `.claude/settings.lock.json` | Merge cache | No | Yes |
| `.claude/deny-list.project.txt` | Project file protection | Yes | No |
| `.claude/deny-list.local.txt` | Local file protection | No | No |
| `.claude/state.json` | Project state for conditionals | No | No |
| `.ketchuprc.json` (or variants) | Cosmiconfig options | Yes | No |

---

## Hook State (`.claude.hooks.json`)

The primary runtime configuration file. Controls auto-continue, commit validation, and other behaviors.

**Location:** Project root (next to `package.json`)

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

## Settings Layering

Ketchup merges settings from three sources in priority order:

1. **Package defaults** (`node_modules/claude-ketchup/templates/settings.json`)
2. **Project overrides** (`.claude/settings.project.json`)
3. **Local overrides** (`.claude/settings.local.json`)

The merged result is written to `.claude/settings.json`.

### Override Syntax

#### Disable specific hooks

```json
{
  "hooks": {
    "PreToolUse": {
      "_disabled": ["node .claude/scripts/pre-tool-use.js"]
    }
  }
}
```

#### Replace entire hook array

```json
{
  "hooks": {
    "SessionStart": {
      "_mode": "replace",
      "_value": []
    }
  }
}
```

#### Add new hooks

New hooks are merged with existing ones (duplicates removed by command):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "my-custom-validator" }
        ]
      }
    ]
  }
}
```

### Default Hook Configuration

The package provides these default hooks:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "node .claude/scripts/session-start.js" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|NotebookEdit|Bash",
        "hooks": [
          { "type": "command", "command": "node .claude/scripts/pre-tool-use.js" }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "node .claude/scripts/user-prompt-submit.js" }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "node .claude/scripts/stop.js" }
        ]
      }
    ]
  }
}
```

---

## Deny-List Files

Protect files from AI modification using glob patterns.

### `.claude/deny-list.project.txt`

Project-wide patterns (committed to repo).

```txt
# Comments start with #

# Secrets
.env
.env.*
*.secret
credentials.json

# Generated files
dist/**
coverage/**
node_modules/**

# Lock files
package-lock.json
pnpm-lock.yaml
```

### `.claude/deny-list.local.txt`

Personal patterns (gitignored).

```txt
# Personal notes
TODO.md
notes/**

# Local experiments
scratch/**
```

### Pattern Syntax

Uses [micromatch](https://github.com/micromatch/micromatch) glob patterns:

| Pattern | Matches |
|---------|---------|
| `*.secret` | Any file ending in `.secret` |
| `dist/**` | Everything in `dist/` recursively |
| `.env*` | `.env`, `.env.local`, `.env.production` |
| `**/test/**` | Any `test/` directory at any depth |
| `src/*.ts` | TypeScript files directly in `src/` |
| `**/*.generated.*` | Any file with `.generated.` in name |

---

## Cosmiconfig Support

For advanced configuration, Ketchup supports cosmiconfig.

### Supported Files

- `.ketchuprc.json`
- `.ketchuprc.yaml` / `.ketchuprc.yml`
- `.ketchuprc.js`
- `ketchup.config.js`
- `ketchup` key in `package.json`

### Configuration Schema

```typescript
interface KetchupConfig {
  /** Directory for ketchup data (reminders, validators). Default: '.ketchup' */
  ketchupDir?: string;
  validators?: {
    dirs?: string[];       // Additional validator directories
    enabled?: boolean;     // Enable/disable validators globally
    mode?: 'on' | 'off' | 'warn';
  };
  reminders?: {
    dirs?: string[];       // Additional reminder directories
  };
}
```

### Example `.ketchuprc.json`

```json
{
  "ketchupDir": ".ketchup",
  "validators": {
    "dirs": ["./custom-validators"],
    "mode": "strict"
  }
}
```

### Example in `package.json`

```json
{
  "name": "my-project",
  "ketchup": {
    "validators": {
      "enabled": true
    }
  }
}
```

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `KETCHUP_ROOT` | Force project root path | Auto-detected |
| `INIT_CWD` | Starting directory for root search | `process.cwd()` |
| `DEBUG` | Enable debug logging | - |
| `KETCHUP_LOG` | Filter activity logging | Log everything |
| `KETCHUP_SKIP_POSTINSTALL` | Skip postinstall in CI | - |

### `KETCHUP_ROOT`

Override automatic project root detection:

```bash
KETCHUP_ROOT=/path/to/project claude
```

### `DEBUG`

Enable debug logging:

```bash
DEBUG=ketchup* claude
```

Logs written to `.claude/logs/ketchup/debug.log`.

### `KETCHUP_LOG`

Filter activity logging by hook name or pattern:

```bash
# Only log session-start hook
KETCHUP_LOG="session-start" claude

# Log everything except 'allowed' messages
KETCHUP_LOG="*,-allowed" claude

# Log multiple specific patterns
KETCHUP_LOG="session-start,block" claude
```

Activity logs written to `.claude/logs/activity.log`.

### `KETCHUP_SKIP_POSTINSTALL`

Skip postinstall script (useful for CI):

```bash
KETCHUP_SKIP_POSTINSTALL=true npm install
```

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

### Usage in Skills

Skills can conditionally load based on state:

```yaml
---
hook: SessionStart
priority: 50
when:
  projectType: typescript
  framework: express
---

# Express TypeScript Guidelines

...
```

All conditions must match (AND logic).

---

## Skill Frontmatter

Skills are Markdown files with YAML frontmatter.

### Location

- Package skills: `node_modules/claude-ketchup/skills/` (symlinked)
- Custom skills: `.claude/skills/`

### Frontmatter Schema

```yaml
---
hook: SessionStart          # Required: When to trigger
priority: 50                # Optional: Order (higher = earlier, default: 0)
mode: code                  # Optional: 'plan' or 'code'
when:                       # Optional: Conditional activation
  projectType: typescript
---
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `hook` | `string` | Required | `SessionStart` or `UserPromptSubmit` |
| `priority` | `number` | `0` | Execution order (higher first) |
| `mode` | `string` | - | Filter by mode: `plan` or `code` |
| `when` | `object` | - | State conditions (all must match) |

---

## Reminder Frontmatter

Reminders are Markdown files with YAML frontmatter.

### Location

- Package reminders: `node_modules/claude-ketchup/reminders/` (symlinked to `.ketchup/reminders/`)
- Custom reminders: `.ketchup/reminders/`

### Frontmatter Schema

```yaml
---
when:
  hook: SessionStart        # Which hook triggers this
  mode: plan               # Optional: 'plan' or 'code'
priority: 100              # Optional: Order (higher = earlier)
---
```

---

## Validator Frontmatter

Validators are Markdown files with YAML frontmatter.

### Location

- Package validators: `node_modules/claude-ketchup/validators/` (symlinked to `.ketchup/validators/`)
- Custom validators: `.ketchup/validators/`

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

Ketchup finds the project root in this order:

1. `KETCHUP_ROOT` environment variable (if set and path exists)
2. Walk up from `INIT_CWD` or `process.cwd()` to find `package.json`
3. Walk up to find `.git` directory
4. Fall back to `process.cwd()`

---

## Logging Configuration

### Debug Logs

**Location:** `.claude/logs/ketchup/debug.log`

**Enable:** `DEBUG=ketchup*`

**Format:** Timestamp, hook name, debug message

### Activity Logs

**Location:** `.claude/logs/activity.log`

**Filter:** `KETCHUP_LOG` environment variable

**Format:** `MM-DD HH:MM:SS [session-id] hook-name: message`

### Hook Session Logs

**Location:** `.claude/logs/hooks/`

**Format:** `{prefix}-{timestamp}.log` (8-char session prefix)

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

### Enable non-stop mode

```json
// .claude.hooks.json
{
  "autoContinue": {
    "mode": "non-stop",
    "maxIterations": 50
  }
}
```

### Disable commit validation

```json
// .claude.hooks.json
{
  "validateCommit": {
    "mode": "off"
  }
}
```

### Add custom file protection

```json
// .claude.hooks.json
{
  "denyList": {
    "enabled": true,
    "extraPatterns": ["*.generated.ts", "migrations/**"]
  }
}
```

### Skip validation for explore agents

```json
// .claude.hooks.json
{
  "subagentHooks": {
    "validateCommitOnExplore": false,
    "validateCommitOnWork": true,
    "validateCommitOnUnknown": true
  }
}
```
