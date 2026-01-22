# Hooks Guide

Configure your supervision. Define your architecture.

Hooks are how you define "the rules." The supervisor enforces them.

::: tip Configuration Reference
For a complete reference of all configuration files and options, see the [Configuration Reference](/configuration).
:::

| Hook | When It Fires | What You Control |
|------|---------------|------------------|
| SessionStart | Session begins | What context Claude receives |
| PreToolUse | Before any tool | What actions are allowed |
| UserPromptSubmit | User sends prompt | What reminders are injected |
| Stop | Execution pauses | Whether to continue or stop |

---

## Create a Custom Skill

Skills inject context into Claude sessions based on hook triggers.

### Step 1: Create the skill file

```bash
cat > .claude/skills/my-skill.md << 'EOF'
---
hook: SessionStart
priority: 50
---

# My Custom Skill

Instructions for Claude...
EOF
```

### Step 2: Configure frontmatter

| Field | Type | Description |
|-------|------|-------------|
| `hook` | string | When to trigger: `SessionStart`, `UserPromptSubmit` |
| `priority` | number | Execution order (higher first, default: 0) |
| `mode` | string | Filter by mode: `plan` or `code` |
| `when` | object | Conditional activation based on state |

### Step 3: Add conditional activation (optional)

```yaml
---
hook: SessionStart
priority: 50
mode: code
when:
  projectType: typescript
---
```

This skill only loads when `state.json` contains `projectType: 'typescript'`.

---

## Protect Files with Deny-List

Define what the AI cannot touch.

Without protection:
- AI modifies .env files
- AI rewrites your carefully crafted configs
- AI "improves" generated files

With deny-list: sensitive files are untouchable.

### Create project-wide patterns

```bash
cat > .claude/deny-list.project.txt << 'EOF'
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

# Specific files
package-lock.json
EOF
```

### Create local-only patterns

For patterns you don't want to commit:

```bash
cat > .claude/deny-list.local.txt << 'EOF'
# Personal files
TODO.md
notes/**
EOF
```

The `.local.txt` file is automatically gitignored.

### Pattern syntax

Uses [micromatch](https://github.com/micromatch/micromatch) glob patterns:

| Pattern | Matches |
|---------|---------|
| `*.secret` | Any file ending in `.secret` |
| `dist/**` | Everything in `dist/` recursively |
| `.env*` | `.env`, `.env.local`, `.env.production` |
| `**/test/**` | Any `test/` directory at any depth |

---

## Override Default Settings

Customize hook behavior per project or locally.

### Project settings (committed)

Create `.claude/settings.project.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "my-custom-validator"
          }
        ]
      }
    ]
  }
}
```

### Local settings (not committed)

Create `.claude/settings.local.json`:

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

### Disable specific hooks

```json
{
  "hooks": {
    "PreToolUse": {
      "_disabled": ["npx tsx node_modules/claude-ketchup/dist/scripts/pre-tool-use.js"]
    }
  }
}
```

### Replace entire hook

```json
{
  "hooks": {
    "SessionStart": {
      "_mode": "replace",
      "_value": [
        {
          "matcher": "",
          "hooks": [
            { "type": "command", "command": "my-session-start" }
          ]
        }
      ]
    }
  }
}
```

---

## Configure Hook State

Control runtime hook behavior via `.claude.hooks.json`.

### Create the state file

```bash
cat > .claude.hooks.json << 'EOF'
{
  "autoContinue": {
    "mode": "smart",
    "maxIterations": 10,
    "iteration": 0,
    "skipModes": ["plan"]
  },
  "validateCommit": {
    "mode": "strict"
  },
  "denyList": {
    "enabled": true,
    "extraPatterns": ["*.generated.ts"]
  },
  "promptReminder": {
    "enabled": true,
    "customReminder": "Remember to follow TDD"
  },
  "subagentHooks": {
    "validateCommitOnExplore": false,
    "validateCommitOnWork": true,
    "validateCommitOnUnknown": true
  }
}
EOF
```

### Auto-continue modes

| Mode | Behavior |
|------|----------|
| `smart` | Analyzes transcript for continuation signals |
| `non-stop` | Always continues until maxIterations |
| `off` | Never auto-continues |

### Validate-commit modes

| Mode | Behavior |
|------|----------|
| `strict` | Blocks commits that violate CLAUDE.md |
| `warn` | Warns but allows commits |
| `off` | No commit validation |

### Subagent-aware hooks

Control which subagent types trigger validation:

```json
{
  "subagentHooks": {
    "validateCommitOnExplore": false,
    "validateCommitOnWork": true,
    "validateCommitOnUnknown": true
  }
}
```

- **Explore subagents** (search, find, analyze): Skip validation
- **Work subagents** (implement, create, fix): Full validation
- **Unknown subagents**: Safe default (validate)

---

## Debug Hooks

### Enable debug logging

```bash
DEBUG=ketchup* claude-ketchup status
```

Logs are written to `.claude/logs/ketchup/debug.log`.

### View hook logs

Session logs are in `.claude/logs/hooks/`:

```bash
tail -f .claude/logs/hooks/*.log
```

### Check hook execution

Each hook outputs JSON. Test manually from your project root:

```bash
# Test session-start (uses local script)
npx tsx .claude/scripts/session-start.ts

# Test pre-tool-use (uses package script via symlink)
npx tsx .claude/scripts/pre-tool-use.ts '{"file_path":"/some/file.ts"}'

# Test user-prompt-submit (uses package script via symlink)
npx tsx .claude/scripts/user-prompt-submit.ts "Write a function"
```

---

## Repair Broken Installation

### Quick fix

```bash
claude-ketchup repair
```

### Diagnose issues

```bash
claude-ketchup doctor
```

### Manual repair

```bash
# Remove and reinstall
rm -rf .claude/scripts .claude/skills .claude/commands
npm install

# Or force specific project root
KETCHUP_ROOT=/path/to/project npx tsx node_modules/claude-ketchup/bin/postinstall.ts
```

---

## Write a Custom Hook Script

### Create the script

```bash
cat > .claude/scripts/my-hook.ts << 'EOF'
#!/usr/bin/env npx tsx

const input = JSON.parse(process.argv[2] || '{}');

// Your logic here
const result = {
  decision: 'allow',
  reason: 'Custom validation passed'
};

console.log(JSON.stringify(result));
EOF
```

### Register in settings

Add to `.claude/settings.project.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx .claude/scripts/my-hook.ts"
          }
        ]
      }
    ]
  }
}
```

### Hook output formats

**SessionStart:**
```json
{ "result": "Context to inject..." }
```

**PreToolUse:**
```json
{ "decision": "allow" }
// or
{ "decision": "block", "reason": "Explanation..." }
```

**UserPromptSubmit:**
```json
{ "result": "Modified prompt with reminders..." }
```

**Stop:**
```json
{ "decision": "CONTINUE", "reason": "More work to do" }
// or
{ "decision": "STOP", "reason": "All tasks complete" }
```

---

## Use Skills with State Conditions

### Define state in state.json

```bash
cat > .claude/state.json << 'EOF'
{
  "projectType": "typescript",
  "framework": "express",
  "testFramework": "vitest"
}
EOF
```

### Create conditional skills

**TypeScript-only skill:**

```markdown
---
hook: SessionStart
priority: 50
when:
  projectType: typescript
---

# TypeScript Guidelines

Use strict mode...
```

**Express-specific skill:**

```markdown
---
hook: SessionStart
priority: 40
when:
  framework: express
---

# Express Guidelines

Use middleware...
```

### Multiple conditions

All conditions must match (AND logic):

```yaml
when:
  projectType: typescript
  testFramework: vitest
```

---

## Clean Up Old Logs

### Manual cleanup

```bash
# Remove logs older than 60 minutes
npx tsx -e "
const { cleanLogs } = require('claude-ketchup');
const result = cleanLogs('.claude/logs/hooks', 60);
console.log('Deleted:', result.deleted.length, 'Kept:', result.kept);
"
```

### Programmatic cleanup

```typescript
import { cleanLogs } from 'claude-ketchup/clean-logs';

const result = cleanLogs('/project/.claude/logs/hooks', 120);
console.log(`Deleted ${result.deleted.length} old logs`);
```

---

## Integrate with CI/CD

### Verify installation in CI

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm exec claude-ketchup doctor
```

### Skip hooks in CI

Set environment variable:

```yaml
env:
  KETCHUP_SKIP_POSTINSTALL: true
```

Or create empty `.claude/settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": { "_mode": "replace", "_value": [] },
    "PreToolUse": { "_mode": "replace", "_value": [] },
    "UserPromptSubmit": { "_mode": "replace", "_value": [] }
  }
}
```
