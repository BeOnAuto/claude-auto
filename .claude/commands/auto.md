# /auto - Hook Control Center

Control the behavior of Claude Code hooks via `.claude/state.json`.

## Commands

### `/auto help`

Show available commands and current state.

### `/auto status`

Show current hook state configuration.

### `/auto non-stop [--max N]`

Enable non-stop mode - auto-continue will ALWAYS continue without asking Claude.

- `--max N`: Optional limit on iterations (default: unlimited)

### `/auto smart`

Enable smart mode (default) - auto-continue uses Claude CLI to decide whether to continue.

### `/auto off`

Disable auto-continue entirely - never auto-continue.

### `/auto skip [modes...]`

Set which permission modes to skip (blocklist).

- `/auto skip` - Show current skip modes
- `/auto skip plan` - Only skip plan mode (default)
- `/auto skip plan default` - Skip both plan and default modes
- `/auto skip none` - Never skip any mode (always auto-continue)

### `/auto commit strict|warn|off`

Control commit validation behavior:

- `strict`: Deny commits that fail validation (default)
- `warn`: Log validation failures but allow commit
- `off`: Skip validation entirely

### `/auto deny on|off`

Enable/disable the deny-list file protection.

### `/auto reminder on|off`

Enable/disable the prompt reminder hook.

### `/auto reset`

Reset all hooks to default settings.

## Implementation

When the user runs `/auto <command>`, you should:

1. Read the current state from `.claude.hooks.json`
2. Apply the requested changes
3. Write the updated state back
4. Display the new state

### State File Location

`.claude.hooks.json` (project root)

### State Schema

```json
{
  "autoContinue": {
    "mode": "smart|non-stop|off",
    "maxIterations": 0,
    "iteration": 0,
    "skipModes": ["plan"]
  },
  "validateCommit": {
    "mode": "strict|warn|off"
  },
  "denyList": {
    "enabled": true
  },
  "promptReminder": {
    "enabled": true
  },
  "updatedAt": "ISO timestamp",
  "updatedBy": "command name"
}
```

### Examples

**Show status:**

```
/auto status
```

**Enable non-stop mode with 10 iteration limit:**

```
/auto non-stop --max 10
```

**Switch to warn-only commit validation:**

```
/auto commit warn
```

**Disable deny list:**

```
/auto deny off
```

## Response Format

After modifying state, display a formatted summary:

```
╭─────────────────────────────────────────╮
│         🎛️  Hook Control State          │
├─────────────────────────────────────────┤
│  Auto-Continue: smart                   │
│  Commit Validation: strict              │
│  Deny List: enabled                     │
│  Prompt Reminder: enabled               │
├─────────────────────────────────────────┤
│  Updated: 2026-01-04T10:30:00           │
│  By: /auto status                       │
╰─────────────────────────────────────────╯
```

For `/auto help`, display:

```
/auto - Hook Control Center

Commands:
  /auto help                  Show this help
  /auto status                Show current state
  /auto non-stop [--max N]    Always continue (N = iteration limit)
  /auto smart                 Claude decides when to continue (default)
  /auto off                   Never auto-continue
  /auto skip [modes...]       Set permission modes to skip
  /auto commit strict|warn|off   Commit validation mode
  /auto deny on|off           Enable/disable file protection
  /auto reminder on|off       Enable/disable prompt reminder
  /auto reset                 Reset all to defaults

Current State:
  [show formatted state box]
```
