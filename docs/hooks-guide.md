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

## Understanding Each Hook

### SessionStart Hook

**Purpose:** Inject initial context when Claude begins a new session.

**When it fires:** Once at the beginning of each Claude session.

**What it does:**
- Loads all reminders configured for SessionStart
- Injects project-specific guidelines and rules
- Sets up the working context for the entire session

**Default behavior:**
- Loads reminders from `.ketchup/reminders/` with `when.hook: SessionStart`
- Prioritizes reminders based on their priority value (higher = earlier)
- Filters reminders based on state conditions if specified

**Example use cases:**
- Inject TDD/TCR methodology rules
- Set project-specific coding standards
- Define architectural patterns to follow
- Establish testing requirements

**Script location:** `.claude/scripts/session-start.js`

### PreToolUse Hook

**Purpose:** Control what tools Claude can use and how.

**When it fires:** Before Claude executes any tool (Edit, Write, Bash, etc.).

**What it does:**
- Validates tool usage against project rules
- Can block dangerous operations
- Enforces file protection via deny-lists
- Runs validators on commit attempts

**Default behavior:**
- Checks deny-list patterns for Edit/Write operations
- Runs commit validators when Claude attempts `git commit`
- Returns ACK (allow) or NACK (block) decisions

**Example use cases:**
- Prevent modifications to sensitive files (.env, credentials)
- Block destructive git operations (force push, hard reset)
- Validate commit messages and content
- Enforce test-driven development

**Script location:** `.claude/scripts/pre-tool-use.js`

### UserPromptSubmit Hook

**Purpose:** Modify or enhance user prompts before Claude processes them.

**When it fires:** Every time the user sends a prompt to Claude.

**What it does:**
- Injects context-aware reminders
- Adds project-specific instructions
- Can modify the prompt based on current state

**Default behavior:**
- Loads reminders with `when.hook: UserPromptSubmit`
- Filters based on current mode (plan/code)
- Appends reminders to user prompt

**Example use cases:**
- Remind Claude of ongoing work patterns
- Inject task-specific guidelines
- Add warnings about common pitfalls
- Include relevant documentation snippets

**Script location:** `.claude/scripts/user-prompt-submit.js`

### Stop Hook

**Purpose:** Decide whether Claude should continue or stop after pausing.

**When it fires:** When Claude's execution pauses (typically after completing a response).

**What it does:**
- Analyzes the current transcript
- Determines if more work is needed
- Can trigger auto-continue behavior

**Default behavior:**
- Checks auto-continue configuration in `.claude.hooks.json`
- In "smart" mode: analyzes transcript for continuation signals
- In "non-stop" mode: always continues until max iterations
- In "off" mode: never auto-continues

**Example use cases:**
- Keep Claude working until all tests pass
- Continue until a feature is complete
- Stop when hitting error limits
- Pause for user review at milestones

**Script location:** `.claude/scripts/stop.js`

---

## Create a Custom Reminder

Reminders inject context into Claude sessions based on hook triggers.

### Step 1: Create the reminder file

```bash
cat > .ketchup/reminders/my-reminder.md << 'EOF'
---
when:
  hook: SessionStart
priority: 50
---

# My Custom Reminder

Instructions for Claude...
EOF
```

### Step 2: Configure frontmatter

#### Complete Reminder Frontmatter Schema

```yaml
---
when:
  hook: SessionStart        # Required: When to trigger
  mode: plan               # Optional: Filter by mode
  projectType: typescript  # Optional: State condition
  framework: express       # Optional: Additional conditions
priority: 100              # Optional: Execution order
---
```

#### Field Reference

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `when.hook` | `'SessionStart' \| 'UserPromptSubmit'` | Yes | - | When to trigger the reminder |
| `when.mode` | `'plan' \| 'code'` | No | - | Filter by Claude mode |
| `when.[key]` | `string` | No | - | State conditions from `.claude/state.json` |
| `priority` | `number` | No | `0` | Execution order (higher = earlier) |

#### Priority Guidelines

| Priority | Use Case |
|----------|----------|
| 100+ | Critical rules that must be injected first |
| 50-99 | Project-specific guidelines |
| 10-49 | Team conventions |
| 0-9 | Nice-to-have suggestions |
| <0 | Low priority, processed last |

### Step 3: Add conditional activation (optional)

```yaml
---
when:
  hook: SessionStart
  mode: code
  projectType: typescript
priority: 50
---
```

This reminder only loads when `state.json` contains `projectType: 'typescript'`.

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
      "_disabled": ["npx tsx .claude/scripts/pre-tool-use.ts"]
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
| `strict` | Blocks commits that violate project rules |
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
npx claude-ketchup repair
```

### Diagnose issues

```bash
npx claude-ketchup doctor
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

## Use Reminders with State Conditions

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

### Create conditional reminders

**TypeScript-only reminder:**

```markdown
---
when:
  hook: SessionStart
  projectType: typescript
priority: 50
---

# TypeScript Guidelines

Use strict mode...
```

**Express-specific reminder:**

```markdown
---
when:
  hook: SessionStart
  framework: express
priority: 40
---

# Express Guidelines

Use middleware...
```

### Multiple conditions

All conditions must match (AND logic):

```yaml
when:
  hook: SessionStart
  projectType: typescript
  testFramework: vitest
```

---

## Clean Up Old Logs

### Using the CLI command

```bash
# Keep only the 100 most recent logs
npx claude-ketchup clean-logs --older-than=100

# Keep only the 50 most recent logs
npx claude-ketchup clean-logs --older-than=50

# Clean all logs (keep none)
npx claude-ketchup clean-logs --older-than=0
```

### Programmatic cleanup

```typescript
import { cleanLogs } from 'claude-ketchup/clean-logs';

// Remove logs older than 120 minutes
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
      - run: npm install
      - run: npx claude-ketchup doctor
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
