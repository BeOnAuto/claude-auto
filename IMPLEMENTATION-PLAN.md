# Claude-Ketchup Implementation Plan

## Overview

Build an npm package (`claude-ketchup`) that provides a Husky-style setup experience for Claude Code projects. On `pnpm install`, it automatically configures hooks, skills, commands, and settings via symlinks and intelligent merging.

**Core Principles:**
- Install once, hooks just work
- Symlinks for live development (file-level, not directory-level)
- Three-tier config: Package → Project → Local
- 100% test coverage enforced
- TDD (Ketchup Technique) for all development

---

## Current Progress

### DONE
- [x] Burst 1: Setup package infrastructure (package.json, tsconfig, vitest)
- [x] Burst 2: findProjectRoot uses KETCHUP_ROOT env var
- [x] 100% test coverage thresholds configured in vitest.config.ts
- [x] @vitest/coverage-v8 installed

### IN PROGRESS
- [ ] Burst 3: findProjectRoot uses INIT_CWD when KETCHUP_ROOT not set (code done, need test for cwd fallback for 100% coverage)

### TODO - Bottle: Root Finder
- [ ] Burst 4: findProjectRoot walks up to find package.json
- [ ] Burst 5: findProjectRoot walks up to find .git
- [ ] Burst 6: findProjectRoot falls back to cwd (test needed for coverage)

### TODO - Bottle: Linker
- [ ] Burst 7: getPackageDir returns package directory
- [ ] Burst 8: isLinkedMode detects pnpm link
- [ ] Burst 9: createSymlink creates file symlink on Unix
- [ ] Burst 10: createSymlink backs up existing non-symlink file
- [ ] Burst 11: createSymlink replaces existing symlink
- [ ] Burst 12: createSymlink is idempotent
- [ ] Burst 13: removeSymlink removes symlink but not real files
- [ ] Burst 14: verifySymlink checks symlink target

### TODO - Bottle: Gitignore Manager
- [ ] generateGitignore creates .claude/.gitignore
- [ ] gitignore lists symlinked files from package
- [ ] gitignore ignores *.local.* pattern
- [ ] gitignore ignores runtime files (state.json, logs/, etc.)

### TODO - Bottle: Postinstall/Preuninstall
- [ ] postinstall detects project root
- [ ] postinstall creates .claude directory
- [ ] postinstall symlinks scripts/, skills/, commands/ files
- [ ] postinstall generates gitignore
- [ ] postinstall merges settings
- [ ] preuninstall removes symlinks
- [ ] preuninstall preserves local files

### TODO - Bottle: Merger
- [ ] mergeSettings loads package template
- [ ] mergeSettings merges project overrides
- [ ] mergeSettings merges local overrides
- [ ] mergeSettings handles _disabled array
- [ ] mergeSettings handles mode: replace
- [ ] mergeSettings dedupes by command
- [ ] lock file prevents unnecessary re-merge

### TODO - Bottle: Runtime Hooks
- [ ] state-manager reads/writes state.json
- [ ] state-manager creates backup before write
- [ ] skills-loader scans skills directories
- [ ] skills-loader parses YAML frontmatter
- [ ] skills-loader filters by hook/mode/conditions
- [ ] skills-loader sorts by priority
- [ ] deny-list loads patterns from project/local
- [ ] deny-list checks paths against patterns
- [ ] session-start.ts outputs filtered skills
- [ ] pre-tool-use.ts blocks denied paths
- [ ] user-prompt-submit.ts injects reminders

### TODO - Bottle: CLI
- [ ] `claude-ketchup status` shows symlink status
- [ ] `claude-ketchup repair` fixes broken symlinks
- [ ] `claude-ketchup doctor` diagnoses issues
- [ ] `claude-ketchup skills` lists enforced skills
- [ ] `/ketchup` command definition

---

## Architecture

### Three-Layer Data Model

| Layer | File Pattern | Git Status | Purpose |
|-------|--------------|------------|---------|
| **Package** | Symlinked files | N/A (in node_modules) | Immutable shared code from npm package |
| **Project** | `*.project.*` | **Tracked** | Team-shared configuration (committed to repo) |
| **Local** | `*.local.*` | **Ignored** | User-specific overrides and runtime artifacts |

### Target File Structure After Install

```
project-root/
├── package.json
├── node_modules/
│   └── claude-ketchup/
│       ├── templates/settings.json
│       ├── scripts/{session-start,pre-tool-use,etc}.ts
│       ├── skills/ketchup.enforced.md
│       └── commands/ketchup.md
│
└── .claude/
    ├── .gitignore                 ← Generated
    ├── scripts/
    │   ├── session-start.ts       🔗 Symlink
    │   └── lib/                   🔗 Symlink
    ├── skills/
    │   ├── ketchup.enforced.md    🔗 Symlink
    │   └── team.enforced.md       👤 TRACKED
    ├── commands/
    │   └── ketchup.md             🔗 Symlink
    ├── settings.json              ⚙️ Generated (merged)
    ├── settings.project.json      👤 TRACKED
    ├── settings.local.json        🙈 IGNORED
    ├── state.json                 ⚙️ Runtime
    └── deny-list.{project,local}.txt
```

---

## Key Files to Implement

| File | Purpose |
|------|---------|
| `src/root-finder.ts` | Project root detection (KETCHUP_ROOT → INIT_CWD → walk up → cwd) |
| `src/linker.ts` | Cross-platform file symlink creation |
| `src/merger.ts` | Three-tier settings merge |
| `src/gitignore-manager.ts` | Generate `.claude/.gitignore` |
| `bin/postinstall.ts` | npm postinstall entry |
| `bin/preuninstall.ts` | npm preuninstall cleanup |
| `bin/cli.ts` | CLI commands |
| `scripts/lib/state-manager.ts` | State CRUD with backup |
| `scripts/lib/skills-loader.ts` | Enforced skills loader |
| `scripts/lib/deny-list.ts` | Deny list checker |

---

## TDD Workflow (Ketchup Technique)

For each burst:
1. **Red**: Write a failing test
2. **Green**: Implement minimum code to pass
3. **TCR**: `npm test && git add -A && git commit -m "burst N: description" || git checkout .`
4. **Refactor**: Clean up if needed
5. **TCR**: Commit refactor
6. **Done**: Move to next burst

Run tests with coverage: `npm test -- --coverage`

---

## Settings Merge Rules

1. Load `templates/settings.json` (package)
2. Deep merge `settings.project.json` (if exists)
3. Deep merge `settings.local.json` (if exists)
4. For hooks arrays with same matcher: concatenate (package first)
5. `mode: 'replace'` in matcher: fully override instead of concat
6. `_disabled` array: remove specific hooks by matcher + command
7. Dedupe by command within each matcher

---

## Enforced Skills Format

```markdown
---
hook: SessionStart           # or array: [SessionStart, UserPromptSubmit]
priority: 100                # Higher runs first (default: 0)
modes: [plan, code]          # Optional mode filter
conditions:
  state:
    autoContinue: smart      # Check state.json values
---

# Skill Content Here
```

---

## Reference

Full spec: `/Users/sam/.claude/plans/jiggly-questing-adleman.md`
