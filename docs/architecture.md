# Architecture

Understanding how claude-ketchup works under the hood.

---

## Design Philosophy

claude-ketchup follows several key principles:

1. **Convention over Configuration**: Sensible defaults that just work
2. **Symlinks over Copies**: Changes to package propagate automatically
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
│  ├── scripts/ ──────────────┐                               │
│  ├── skills/ ───────────────┼──► Symlinks to package        │
│  ├── commands/ ─────────────┘                               │
│  ├── settings.json ────────────► Merged configuration       │
│  ├── settings.project.json ────► Project overrides          │
│  ├── settings.local.json ──────► Local overrides            │
│  ├── deny-list.project.txt ────► File protection patterns   │
│  ├── deny-list.local.txt ──────► Local protection patterns  │
│  ├── state.json ───────────────► Runtime state              │
│  └── logs/                                                   │
│      ├── ketchup/debug.log ────► Debug output               │
│      └── hooks/*.log ──────────► Session logs               │
│                                                              │
│  .claude.hooks.json ───────────► Hook behavior state        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           node_modules/claude-ketchup/                       │
├─────────────────────────────────────────────────────────────┤
│  scripts/                   Source hook scripts              │
│  skills/                    Default skills                   │
│  commands/                  Command definitions              │
│  templates/settings.json    Default settings                 │
│  src/                       Core library code                │
│  bin/                       CLI and lifecycle scripts        │
└─────────────────────────────────────────────────────────────┘
```

---

## Lifecycle Hooks

### Postinstall

When you run `npm install claude-ketchup`, the postinstall script:

```
postinstall.ts
    │
    ├─► findProjectRoot()
    │   ├─► Check KETCHUP_ROOT env
    │   ├─► Walk up to find package.json
    │   └─► Walk up to find .git
    │
    ├─► Create .claude/ directory
    │
    ├─► For each directory (scripts, skills, commands):
    │   └─► createSymlink(source, target)
    │       ├─► If symlink exists → verify or replace
    │       ├─► If file exists → backup and replace
    │       └─► If nothing → create symlink
    │
    ├─► generateGitignore()
    │   └─► Write symlinked files + runtime patterns
    │
    └─► mergeSettings()
        ├─► Load templates/settings.json
        ├─► Merge settings.project.json (if exists)
        ├─► Merge settings.local.json (if exists)
        ├─► Check lock file hash
        └─► Write settings.json + lock file
```

### Preuninstall

When you run `npm uninstall claude-ketchup`:

```
preuninstall.ts
    │
    ├─► findProjectRoot()
    │
    └─► For each directory (scripts, skills, commands):
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
│  ├─► scanSkills()           │
│  ├─► parseSkill() each      │
│  ├─► filterByHook()         │
│  ├─► sortByPriority()       │
│  └─► Concatenate content    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  { result: "skill content"} │
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
│  │   skills                 │
│  └─► Append <system-reminder>│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  "prompt + <system-reminder>│
│   skill content             │
│   </system-reminder>"       │
└─────────────────────────────┘
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
claude-ketchup/
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
│   ├── skills-loader.ts    Skill parsing and filtering
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
│   │   └── skills.ts       Skills list command
│   │
│   └── hooks/
│       ├── session-start.ts     SessionStart handler
│       ├── pre-tool-use.ts      PreToolUse handler
│       ├── user-prompt-submit.ts  UserPromptSubmit handler
│       ├── auto-continue.ts     Stop hook / auto-continue
│       └── validate-commit.ts   Commit validation
│
├── scripts/                 Symlink targets (copied to .claude/scripts/)
│   ├── pre-tool-use.ts
│   ├── user-prompt-submit.ts
│   └── test-hooks.sh
│
├── skills/                  Symlink targets (copied to .claude/skills/)
│   └── ketchup.enforced.md
│
├── commands/                Symlink targets (copied to .claude/commands/)
│   └── ketchup.md
│
└── templates/
    └── settings.json        Default hook configuration
```

### Project .claude/ Structure (After Install)

```
your-project/.claude/
├── scripts/
│   ├── pre-tool-use.ts       → symlink to package
│   ├── user-prompt-submit.ts → symlink to package
│   ├── session-start.ts      Local (customizable)
│   ├── auto-continue.ts      Local (customizable)
│   ├── validate-commit.ts    Local (customizable)
│   ├── deny-list.ts          Local (customizable)
│   ├── prompt-reminder.ts    Local (customizable)
│   └── clean-logs.ts         Local (customizable)
├── skills/
│   ├── ketchup.enforced.md   → symlink to package
│   └── *.md                  Your custom skills
├── commands/
│   ├── ketchup.md            → symlink to package
│   └── *.md                  Your custom commands
├── logs/
│   ├── hooks/                Session logs
│   └── ketchup/              Debug logs
├── settings.json             Merged (generated)
├── settings.project.json     Project overrides (optional)
├── settings.local.json       Local overrides (optional)
├── deny-list.project.txt     Project deny patterns
├── deny-list.local.txt       Local deny patterns
└── .gitignore                Generated
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| **commander** | CLI argument parsing for `claude-ketchup` commands |
| **micromatch** | Glob pattern matching for deny-list file filtering |
| **yaml** | YAML parsing for skill frontmatter extraction |

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
├── Skills loader (parse, filter, sort)
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
├── Skill injection
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

- Skills are scanned once per hook execution
- Deny patterns are loaded once per check
- State is read/written only when needed

### Small Memory Footprint

- No in-memory caching between hook invocations
- Each script starts fresh, avoiding memory leaks
- Logs are append-only with cleanup utility
