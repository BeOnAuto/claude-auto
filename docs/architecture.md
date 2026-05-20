# Architecture

How Ketchup works under the hood.

---

## The Guardrail Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECT                          │
│                       (That's you)                           │
│   Defines: ketchup-plan.md, reminders, deny-list, rules     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GUARDRAIL STACK                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Reminders   │  │ Deny-list   │  │ Validators  │         │
│  │             │  │             │  │             │         │
│  │ Session +   │  │ Glob file   │  │ ACK / NACK  │         │
│  │ per-prompt  │  │ protection  │  │ on commit   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│        ┌─────────────┐        ┌─────────────┐              │
│        │ Parallel    │        │ TCR         │              │
│        │ subagents   │        │ gate        │              │
│        │             │        │             │              │
│        │ plan deps   │        │ test &&     │              │
│        │ drive Task  │        │ commit ||   │              │
│        │ launches    │        │ revert      │              │
│        └─────────────┘        └─────────────┘              │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     CLEAN INCREMENTS                         │
│          One test. One behavior. One commit.                 │
│               Ready for your review.                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Philosophy

ketchup follows several key principles:

1. **Convention over Configuration**: Sensible defaults that just work
2. **Plugin Architecture**: Runs as a Claude Code plugin with bundled hook scripts
3. **Transparent Operation**: All files are human-readable
4. **Minimal Dependencies**: Only two runtime dependencies (gray-matter, micromatch)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Project                             │
├─────────────────────────────────────────────────────────────┤
│  .claude/                                                    │
│  ├── deny-list.project.txt ────► File protection patterns   │
│  └── deny-list.local.txt ──────► Local protection patterns  │
│                                                              │
│  .ketchup/                                               │
│  ├── reminders/ ───────────────► Context injection files    │
│  ├── validators/ ──────────────► Commit validation rules    │
│  ├── state.json ───────► Hook behavior state        │
│  └── logs/                                                   │
│      └── activity.log ─────────► Activity log               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                   Plugin loaded by Claude Code
                              │
┌─────────────────────────────────────────────────────────────┐
│           ketchup plugin                                 │
├─────────────────────────────────────────────────────────────┤
│  dist/bundle/scripts/       Bundled hook scripts             │
│  reminders/                 Default reminders                │
│  validators/                Default validators               │
│  src/                       Core library code                │
└─────────────────────────────────────────────────────────────┘
```

---

## Hook Execution Flow

### SessionStart Hook

```
Claude Code Session Starts
         │
         ▼
┌─────────────────────────────┐
│  settings.json hooks config │
│  SessionStart: [...]        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  scripts/session-start.ts   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  handleSessionStart()       │
│  ├─► scanReminders()        │
│  ├─► parseReminder() each   │
│  ├─► matchReminders()       │
│  ├─► sortByPriority()       │
│  └─► Concatenate content    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  { result: "reminder content"} │
│  Injected into session      │
└─────────────────────────────┘
```

### PreToolUse Hook

```
Claude Attempts Edit/Write
         │
         ▼
┌─────────────────────────────┐
│  settings.json hooks config │
│  PreToolUse: [Edit|Write]   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  scripts/pre-tool-use.ts    │
│  Input: { file_path: "..." }│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  handlePreToolUse()         │
│  ├─► loadDenyPatterns()     │
│  │   ├─► deny-list.project  │
│  │   └─► deny-list.local    │
│  └─► isDenied(path, patterns)│
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   { allow }     { block }
   Continue      Prevent edit
```

### UserPromptSubmit Hook

```
User Submits Prompt
         │
         ▼
┌─────────────────────────────┐
│  settings.json hooks config │
│  UserPromptSubmit: [...]    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  user-prompt-submit.ts      │
│  Input: "user prompt text"  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  handleUserPromptSubmit()   │
│  ├─► Load UserPromptSubmit  │
│  │   reminders              │
│  └─► Append <system-reminder>│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  "prompt + <system-reminder>│
│   reminder content          │
│   </system-reminder>"       │
└─────────────────────────────┘
```

### Validator Execution (PreToolUse for git commit)

```
Claude Attempts git commit
         │
         ▼
┌─────────────────────────────┐
│  PreToolUse Hook fires      │
│  Tool: Bash (git commit)    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  scripts/validate-commit.ts │
│  Input: commit message      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  handleValidateCommit()     │
│  ├─► loadValidators()       │
│  │   └─► .ketchup/validators│
│  ├─► parseValidator() each  │
│  ├─► filterEnabled()        │
│  └─► sendToSupervisor()     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Validators evaluates    │
│  each validator rule        │
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
     { ACK }      { NACK }
   Commit OK    Block + explain
```

---

## Subagent Classification

The subagent classifier analyzes Task tool descriptions to determine behavior.

```
Task Description
      │
      ▼
┌─────────────────────────┐
│ Check EXPLORE_PATTERNS  │
│ search, find, analyze...│
└──────────┬──────────────┘
      │
      ▼
┌─────────────────────────┐
│ Check WORK_PATTERNS     │
│ implement, create, fix..│
└──────────┬──────────────┘
      │
      ├──────────────────────────────────┐
      │                                   │
      ▼                                   ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Only explore│  │ Only work   │  │ Both or     │
│ patterns    │  │ patterns    │  │ neither     │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
   'explore'         'work'          'unknown'
```

### Classification Impact

```typescript
if (subagentType === 'explore' && !state.validateCommitOnExplore) {
  // Skip commit validation for explore tasks
  return;
}

if (subagentType === 'work' && state.validateCommitOnWork) {
  // Run full commit validation
  validateCommit();
}
```

---

## Directory Structure

### Plugin Structure

```
ketchup/
├── src/
│   ├── index.ts            Barrel export (public API)
│   ├── path-resolver.ts    Path resolution from environment
│   ├── hook-state.ts       Hook state management (internal)
│   ├── reminder-loader.ts  Reminder parsing and filtering
│   ├── validator-loader.ts Validator parsing and loading
│   ├── deny-list.ts        Deny pattern loading/matching
│   ├── logger.ts           Session logging (internal)
│   ├── debug-logger.ts     Debug output (internal)
│   ├── clean-logs.ts       Log cleanup (internal)
│   ├── subagent-classifier.ts  Task classification (internal)
│   │
│   └── hooks/
│       ├── session-start.ts     SessionStart handler
│       ├── pre-tool-use.ts      PreToolUse handler
│       ├── user-prompt-submit.ts  UserPromptSubmit handler
│       └── validate-commit.ts   Commit validation
│
├── scripts/                 Source scripts (bundled to dist/bundle/scripts/)
│   ├── pre-tool-use.ts
│   ├── user-prompt-submit.ts
│   └── test-hooks.sh
│
├── reminders/               Default reminders
│   └── *.md                 Context injection reminders
│
├── validators/              Default validators
│   └── *.md                 Commit validation rules
│
└── .claude-plugin/
    └── plugin.json          Plugin manifest
```

### Project Structure (After Plugin Activation)

```
your-project/
├── .claude/
│   ├── deny-list.project.txt     Project deny patterns
│   └── deny-list.local.txt       Local deny patterns
│
├── .ketchup/
│   ├── reminders/
│   │   └── *.md                  Context injection reminders
│   ├── validators/
│   │   └── *.md                  Commit validation rules
│   ├── state.json        Hook behavior state
│   └── logs/
│       └── activity.log          Activity log
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| **micromatch** | Glob pattern matching for deny-list file filtering |
| **gray-matter** | YAML frontmatter parsing for reminders and validators |

All dependencies are chosen for:
- Small footprint
- No native bindings
- Well-maintained

---

## Error Handling

### Graceful Degradation

```typescript
// Functions return safe defaults when files don't exist
function readState(dir: string): State {
  if (!fs.existsSync(statePath)) {
    return {};  // Empty state, not an error
  }
  // ...
}
```

### Error Isolation

Each hook script runs in isolation:

```
┌────────────────────┐
│  Hook Script       │
│  try {             │
│    handleHook();   │
│  } catch (error) { │
│    // Log error    │
│    // Return safe  │
│    // default      │
│  }                 │
└────────────────────┘
```

Hooks that fail return safe defaults:
- PreToolUse: `{ decision: "allow" }` (fail open)
- SessionStart: `{ result: "" }` (empty context)
- UserPromptSubmit: `{ result: originalPrompt }` (no modification)

---

## Testing Strategy

```
Unit Tests (vitest)
├── Reminder loader (parse, filter, sort)
├── Validator loader (parse, validate)
├── Deny-list (load patterns, match files)
├── Hook state (read, write, update)
├── Subagent classifier (patterns, extraction)
└── Path resolver (environment-based resolution)

E2E Tests (scripts/test-hooks.sh)
├── Deny-list blocking
├── Reminder injection
├── Validator execution
├── Subagent classification pipeline
└── Hook state persistence
```

---

## Performance Considerations

### Minimal File I/O

- Reminders are scanned once per hook execution
- Validators are loaded once per validation
- Deny patterns are loaded once per check
- State is read/written only when needed

### Small Memory Footprint

- No in-memory caching between hook invocations
- Each script starts fresh, avoiding memory leaks
- Logs are append-only with cleanup utility
