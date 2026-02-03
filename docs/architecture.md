# Architecture

Understanding how the Quality Stack works under the hood.

---

## The Quality Stack Implementation

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECT                          │
│                       (That's you)                           │
│   Defines: ketchup-plan.md, reminders, deny-list, rules     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    THE QUALITY STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Auto-       │  │ Parallel    │  │ Supervisor  │         │
│  │ Planning    │  │ Execution   │  │ Validation  │         │
│  │             │  │             │  │             │         │
│  │ ketchup-    │  │ Sub-agents  │  │ ACK / NACK  │         │
│  │ plan.md     │  │ [depends:]  │  │ hooks       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│        ┌─────────────┐        ┌─────────────┐              │
│        │ Auto-       │        │ TCR         │              │
│        │ Continue    │        │ Discipline  │              │
│        │             │        │             │              │
│        │ Stop hook   │        │ test &&     │              │
│        │ checks plan │        │ commit ||   │              │
│        │ for TODOs   │        │ revert      │              │
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

claude-auto follows several key principles:

1. **Convention over Configuration**: Sensible defaults that just work
2. **Copied Scripts, Layered Settings**: Hook scripts are copied to `.claude-auto/scripts/` for reliability; settings use a layered merge strategy
3. **Layered Settings**: Package → Project → Local override chain
4. **Transparent Operation**: All files are human-readable
5. **Minimal Dependencies**: Only three runtime dependencies

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Project                             │
├─────────────────────────────────────────────────────────────┤
│  .claude/                                                    │
│  ├── commands/ ────────────────► Copied from package        │
│  ├── settings.json ────────────► Merged configuration       │
│  ├── settings.project.json ────► Project overrides          │
│  ├── settings.local.json ──────► Local overrides            │
│  ├── deny-list.project.txt ────► File protection patterns   │
│  ├── deny-list.local.txt ──────► Local protection patterns  │
│  └── state.json ───────────────► Runtime state              │
│                                                              │
│  .claude-auto/                                                   │
│  ├── scripts/ ─────────────────► Hook scripts (copied)      │
│  ├── reminders/ ───────────────► Context injection files    │
│  ├── validators/ ──────────────► Commit validation rules    │
│  ├── .claude.hooks.json ───────► Hook behavior state        │
│  └── logs/                                                   │
│      └── activity.log ─────────► Activity log               │
│                                                              │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           node_modules/claude-auto/                       │
├─────────────────────────────────────────────────────────────┤
│  scripts/                   Source hook scripts              │
│  reminders/                 Default reminders                │
│  validators/                Default validators               │
│  commands/                  Command definitions              │
│  templates/settings.json    Default settings                 │
│  src/                       Core library code                │
│  bin/                       CLI and lifecycle scripts        │
└─────────────────────────────────────────────────────────────┘
```

---

## Lifecycle Hooks

### Postinstall

When you run `npx claude-auto install`, the installation script:

```
install()
    │
    ├─► Resolve target path
    │
    ├─► Create .claude/ directory
    │
    ├─► Create settings.json from template
    │   └─► Skip if settings.json already exists
    │
    ├─► Copy bundled scripts to .claude-auto/scripts/
    │   └─► session-start.js, pre-tool-use.js,
    │       user-prompt-submit.js, auto-continue.js
    │
    ├─► Copy commands to .claude/commands/
    │
    ├─► Copy validators to .claude-auto/validators/
    │
    ├─► Copy reminders to .claude-auto/reminders/
    │
    └─► Initialize hook state
        └─► .claude-auto/.claude.hooks.json with defaults
            (autoContinue: smart, validateCommit: strict,
             denyList: enabled)
```

### Preuninstall

When you run `npm uninstall claude-auto`:

```
preuninstall.ts
    │
    ├─► findProjectRoot()
    │
    └─► For each directory (scripts, reminders, commands):
        └─► removeSymlink() for each symlink
            └─► Only removes if target is symlink (preserves real files)
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

### Stop Hook

```
Claude Execution Pauses
         │
         ▼
┌─────────────────────────────┐
│  settings.json hooks config │
│  Stop: [...]                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  scripts/auto-continue.ts   │
│  Input: transcript & plan   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  handleStop()               │
│  ├─► readKetchupPlan()      │
│  ├─► countTodos()           │
│  ├─► analyzeTranscript()    │
│  └─► checkContinuation()    │
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   { CONTINUE }   { STOP }
   Resume work    End session
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
│  │   └─► .claude-auto/validators│
│  ├─► parseValidator() each  │
│  ├─► filterEnabled()        │
│  └─► sendToSupervisor()     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Supervisor AI evaluates    │
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

## Settings Merge Strategy

Settings are merged using a layered approach with special override syntax.

### Layer Priority

```
Layer 1: templates/settings.json (package defaults)
              │
              ▼ deep merge
Layer 2: settings.project.json (project overrides)
              │
              ▼ deep merge
Layer 3: settings.local.json (local overrides)
              │
              ▼
         Final settings.json
```

### Merge Rules

**Standard array append (default):**

```json
// templates/settings.json
{ "hooks": { "SessionStart": [{ "hooks": [...] }] } }

// settings.project.json
{ "hooks": { "SessionStart": [{ "hooks": [...] }] } }

// Result: Both hooks concatenated, deduplicated by command
```

**Replace mode:**

```json
// settings.project.json
{
  "hooks": {
    "SessionStart": {
      "_mode": "replace",
      "_value": [{ "hooks": [...] }]
    }
  }
}

// Result: Only _value contents, package defaults removed
```

**Disable mode:**

```json
// settings.project.json
{
  "hooks": {
    "SessionStart": {
      "_disabled": ["command-to-remove"]
    }
  }
}

// Result: Package defaults minus disabled commands
```

### Lock File Caching

```
┌───────────────────┐
│ Compute SHA-256   │
│ of all inputs     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Compare with      │
│ settings.lock.json│
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Match     Differ
  Skip      Remerge
  merge     & update
            lock
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

## Clue Collection

The clue collector analyzes Claude transcripts for continuation signals.

```
transcript.jsonl
      │
      ▼
┌─────────────────────────┐
│ Parse JSONL lines       │
│ Extract entries         │
└──────────┬──────────────┘
           │
           ├─────────────────────────────────────────┐
           │                                          │
           ▼                                          ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│ Pattern Detection       │          │ Metadata Extraction     │
│ ├─► CONTINUE_PATTERNS   │          │ ├─► ketchup-plan paths  │
│ ├─► ketchup mentions    │          │ ├─► working directories │
│ └─► plan mentions       │          │ └─► current cwd         │
└──────────┬──────────────┘          └──────────┬──────────────┘
           │                                     │
           └─────────────┬───────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ ClueCollectorResult                                          │
│ ├─► clues: Array<Clue>     Detected patterns                │
│ ├─► lastChats: Array       Last 5 exchanges                 │
│ ├─► ketchupPlanPaths       Found plan files                 │
│ ├─► workingDirs            Detected directories             │
│ └─► summary: string        Human-readable summary           │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

### Package Structure

```
claude-auto/
├── bin/
│   ├── cli.ts              CLI entry point
│   ├── postinstall.ts      npm postinstall script
│   └── preuninstall.ts     npm preuninstall script
│
├── src/
│   ├── index.ts            Barrel export (public API)
│   ├── root-finder.ts      Project root detection
│   ├── linker.ts           Symlink management
│   ├── gitignore-manager.ts  Gitignore generation
│   ├── settings-merger.ts  Settings merge logic
│   ├── state-manager.ts    Simple state read/write
│   ├── hook-state.ts       Hook state management (internal)
│   ├── reminder-loader.ts  Reminder parsing and filtering
│   ├── validator-loader.ts Validator parsing and loading
│   ├── deny-list.ts        Deny pattern loading/matching
│   ├── logger.ts           Session logging (internal)
│   ├── debug-logger.ts     Debug output (internal)
│   ├── clean-logs.ts       Log cleanup (internal)
│   ├── subagent-classifier.ts  Task classification (internal)
│   ├── clue-collector.ts   Transcript analysis (internal)
│   ├── postinstall.ts      Postinstall logic
│   ├── preuninstall.ts     Preuninstall logic
│   ├── e2e.test.ts         End-to-end tests
│   │
│   ├── cli/
│   │   ├── cli.ts          Commander setup
│   │   ├── status.ts       Status command
│   │   ├── repair.ts       Repair command
│   │   ├── doctor.ts       Doctor command
│   │   └── reminders.ts    Reminders list command
│   │
│   └── hooks/
│       ├── session-start.ts     SessionStart handler
│       ├── pre-tool-use.ts      PreToolUse handler
│       ├── user-prompt-submit.ts  UserPromptSubmit handler
│       ├── auto-continue.ts     Stop hook / auto-continue
│       └── validate-commit.ts   Commit validation
│
├── scripts/                 Source scripts (bundled to dist/bundle/scripts/)
│   ├── pre-tool-use.ts
│   ├── user-prompt-submit.ts
│   └── test-hooks.sh
│
├── reminders/               Symlink targets (copied to .claude-auto/reminders/)
│   └── *.md                 Context injection reminders
│
├── validators/              Symlink targets (copied to .claude-auto/validators/)
│   └── *.md                 Commit validation rules
│
├── commands/                Symlink targets (copied to .claude/commands/)
│   └── ketchup.md
│
└── templates/
    └── settings.json        Default hook configuration
```

### Project .claude/ Structure (After Install)

```
your-project/
├── .claude/
│   ├── commands/
│   │   └── *.md                  Copied from package
│   ├── settings.json             Merged (generated)
│   ├── settings.project.json     Project overrides (optional)
│   ├── settings.local.json       Local overrides (optional)
│   ├── deny-list.project.txt     Project deny patterns
│   └── deny-list.local.txt       Local deny patterns
│
├── .claude-auto/
│   ├── scripts/
│   │   ├── session-start.js      Copied from package bundle
│   │   ├── pre-tool-use.js       Copied from package bundle
│   │   ├── user-prompt-submit.js Copied from package bundle
│   │   └── auto-continue.js      Copied from package bundle
│   ├── reminders/
│   │   └── *.md                  Copied from package
│   ├── validators/
│   │   └── *.md                  Copied from package
│   ├── .claude.hooks.json        Hook behavior state
│   └── logs/
│       └── activity.log          Activity log
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| **commander** | CLI argument parsing for `claude-auto` commands |
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

// Symlink operations are idempotent
function createSymlink(source: string, target: string): void {
  if (existingSymlinkPointsToSource) {
    return;  // Already correct, no-op
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
├── Core utilities (linker, root-finder, etc.)
├── Reminder loader (parse, filter, sort)
├── Validator loader (parse, validate)
├── Deny-list (load patterns, match files)
├── Settings merger (merge, override modes)
├── Hook state (read, write, update)
├── Subagent classifier (patterns, extraction)
└── CLI commands (status, doctor, repair)

E2E Tests (scripts/test-hooks.sh)
├── Full postinstall flow
├── Symlink creation/verification
├── Settings merge with all override modes
├── Deny-list blocking
├── Reminder injection
├── Validator execution
├── Subagent classification pipeline
└── Hook state persistence
```

---

## Performance Considerations

### Lock File Optimization

Settings are only remerged when input files change:

```typescript
const currentHash = computeHash([
  packageContent,
  projectContent,
  localContent
]);

if (lockData.hash === currentHash) {
  return;  // Skip expensive merge
}
```

### Minimal File I/O

- Reminders are scanned once per hook execution
- Validators are loaded once per validation
- Deny patterns are loaded once per check
- State is read/written only when needed

### Small Memory Footprint

- No in-memory caching between hook invocations
- Each script starts fresh, avoiding memory leaks
- Logs are append-only with cleanup utility
