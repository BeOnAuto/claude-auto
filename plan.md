# Claude-Ketchup Implementation Specification

## Executive Summary

Build an npm package (`claude-ketchup`) that provides a Husky-style setup experience for Claude Code projects. On `npm install`, it automatically configures hooks, skills, commands, and settings via symlinks and intelligent merging.

**Core Principles:**

- Install once, hooks just work
- Symlinks for live development
- Three-tier config: Package → Project → Local
- Fail gracefully, log clearly

---

## Architecture Overview

### Three-Layer Data Model

| Layer       | File Pattern                                        | Git Status            | Purpose                                       |
| ----------- | --------------------------------------------------- | --------------------- | --------------------------------------------- |
| **Package** | Symlinked dirs (`scripts/`, `skills/`, `commands/`) | N/A (in node_modules) | Immutable shared code from npm package        |
| **Project** | `*.project.*`                                       | **Tracked**           | Team-shared configuration (committed to repo) |
| **Local**   | `*.local.*`                                         | **Ignored**           | User-specific overrides and runtime artifacts |

### Target File Structure

After `npm install claude-ketchup`, the project should have:

```
project-root/
├── package.json
├── node_modules/
│   └── claude-ketchup/
│       ├── package.json
│       ├── bin/
│       │   ├── postinstall.js
│       │   └── preuninstall.js
│       ├── templates/
│       │   ├── settings.json          # Base settings
│       │   ├── gitignore.txt          # Template for .claude/.gitignore
│       │   └── recommended-mcps.json  # Optional MCP servers
│       ├── scripts/
│       │   ├── session-start.ts
│       │   ├── pre-tool-use.ts
│       │   ├── post-tool-use.ts
│       │   ├── user-prompt-submit.ts
│       │   └── lib/
│       │       ├── skills-loader.ts
│       │       ├── state-manager.ts
│       │       ├── deny-list.ts
│       │       └── utils.ts
│       ├── skills/
│       │   ├── ketchup.enforced.md
│       │   └── tcr.skill.md
│       └── commands/
│           └── ketchup.md
│
└── .claude/
    ├── .gitignore                 ← Generated (managed by package)
    │
    ├── scripts/                   📁 Directory (package scripts symlinked individually)
    │   ├── session-start.ts       🔗 Symlink → node_modules/claude-ketchup/scripts/session-start.ts
    │   ├── pre-tool-use.ts        🔗 Symlink → node_modules/claude-ketchup/scripts/pre-tool-use.ts
    │   ├── lib/                   🔗 Symlink → node_modules/claude-ketchup/scripts/lib/
    │   └── my-custom.ts           👤 Local script (not symlinked)
    │
    ├── skills/                    📁 Directory (mixed: symlinks + local files)
    │   ├── ketchup.enforced.md    🔗 Symlink → node_modules/claude-ketchup/skills/ketchup.enforced.md
    │   ├── tcr.skill.md           🔗 Symlink → node_modules/claude-ketchup/skills/tcr.skill.md
    │   ├── team.enforced.md       👤 TRACKED - Team skill (not symlinked)
    │   └── personal.enforced.md   🙈 IGNORED - Local skill (*.local.* pattern)
    │
    ├── commands/                  📁 Directory (mixed: symlinks + local files)
    │   ├── ketchup.md             🔗 Symlink → node_modules/claude-ketchup/commands/ketchup.md
    │   ├── team-workflow.md       👤 TRACKED - Team command (not symlinked)
    │   └── my-shortcut.local.md   🙈 IGNORED - Local command
    │
    ├── settings.json              ⚙️ Generated (merge output - DO NOT EDIT)
    ├── settings.json.lock         ⚙️ Generated (checksums for change detection)
    ├── state.json                 ⚙️ Runtime state
    ├── state.json.bak             ⚙️ Auto-backup of state
    ├── logs/                      ⚙️ Runtime logs
    ├── _backup/                   ⚙️ Backups of replaced content
    │
    ├── settings.project.json      👤 TRACKED - Team overrides
    ├── deny-list.project.txt      👤 TRACKED - Team deny patterns
    │
    ├── settings.local.json        🙈 IGNORED - User overrides
    └── deny-list.local.txt        🙈 IGNORED - User deny patterns
```

---

## Key Design Changes from Original Plan

| Original                    | Updated                                                | Rationale                                               |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| `*.local.*` only            | `*.project.*` + `*.local.*`                            | Three-tier allows team sharing AND personal overrides   |
| Gitignore entire `.claude/` | Smart `.gitignore` inside `.claude/`                   | Enables committing project configs while ignoring local |
| `settings.local.json`       | Both `settings.project.json` and `settings.local.json` | Team can share config without affecting local           |
| No preuninstall             | `preuninstall.js` cleanup                              | Clean removal of symlinks                               |
| `state.json` only           | `state.json` + `state.json.bak`                        | Auto-backup before writes                               |
| No backup dir               | `_backup/` directory                                   | Safe storage of replaced content                        |
| Directory-level symlinks    | **File-level symlinks**                                | Allows project/local files to coexist in same directory |

---

## Implementation Phases

### Phase 1: The Linker (Core Infrastructure)

**Files to create:**

- `src/root-finder.ts` - Project root detection with fallback chain
- `src/linker.ts` - Cross-platform symlink creation (relative on Unix, junctions on Windows)
- `src/gitignore-manager.ts` - Generate and manage `.claude/.gitignore`
- `bin/postinstall.ts` - pnpm postinstall hook
- `bin/preuninstall.ts` - pnpm preuninstall cleanup

**Key behaviors:**

- Detect project root via `KETCHUP_ROOT` env, `INIT_CWD`, `npm_config_local_prefix`, or walk up
- Skip if running inside `node_modules/claude-ketchup`
- **Symlink individual files** (not directories) for skills/, commands/, scripts/
- This allows project and local files to coexist in the same directory
- Backup existing non-symlink files to `_backup/`
- Atomic symlink creation (create temp, then rename)
- Verify symlinks point to correct targets

**File-level symlink strategy:**

```
# For each file in package's skills/, commands/, scripts/:
.claude/skills/ketchup.enforced.md → ../node_modules/claude-ketchup/skills/ketchup.enforced.md
.claude/commands/ketchup.md → ../node_modules/claude-ketchup/commands/ketchup.md
# Exception: scripts/lib/ can be directory-level symlink (internal implementation detail)
```

### Phase 2: The Merger (Settings & Config)

**Files to create:**

- `src/merger.ts` - Three-tier settings merge logic

**Merge order:** Package → Project → Local

**Hook merging rules:**

1. Same matcher: concatenate hooks arrays (package first, then project, then local)
2. `mode: 'replace'` in matcher: fully override instead of concat
3. `_disabled` array: remove specific hooks by matcher + command
4. Dedupe by command within each matcher

**Lock file:** `settings.json.lock` with MD5 checksums of all sources

### Phase 3: The Runtime (Hooks & Skills)

**Files to create:**

- `scripts/lib/state-manager.ts` - State CRUD with backup
- `scripts/lib/skills-loader.ts` - Load and filter enforced skills
- `scripts/lib/deny-list.ts` - Check paths against deny patterns
- `scripts/session-start.ts` - SessionStart hook
- `scripts/pre-tool-use.ts` - PreToolUse hook (deny list, dangerous commands)
- `scripts/post-tool-use.ts` - PostToolUse hook
- `scripts/user-prompt-submit.ts` - UserPromptSubmit hook

**Skills loading:**

- Scan: `skills/` (package), `skills.project/`, `skills.local/`
- Filter by: `hook`, `modes`, `conditions.state`
- Sort by: `priority` (desc), then alphabetical
- Token budget: ~2000 tokens, warn and truncate if exceeded
- Session deduplication: track injected skills in `state.json`

### Phase 4: DX & CLI

**Files to create:**

- `bin/cli.ts` - Commander-based CLI
- `commands/ketchup.md` - `/ketchup` command definition

**CLI commands:**

```
claude-ketchup status   - Show current status
claude-ketchup repair   - Fix symlinks and re-merge
claude-ketchup doctor   - Diagnose common issues
claude-ketchup skills   - List all enforced skills
claude-ketchup set <k> <v> - Update state value
```

---

## Package Structure

```
claude-ketchup/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── bin/
│   ├── postinstall.ts
│   ├── preuninstall.ts
│   └── cli.ts
├── src/
│   ├── index.ts
│   ├── linker.ts
│   ├── merger.ts
│   ├── root-finder.ts
│   ├── gitignore-manager.ts
│   └── utils.ts
├── templates/
│   ├── settings.json
│   ├── gitignore.txt
│   └── recommended-mcps.json
├── scripts/
│   ├── session-start.ts
│   ├── pre-tool-use.ts
│   ├── post-tool-use.ts
│   ├── user-prompt-submit.ts
│   └── lib/
│       ├── skills-loader.ts
│       ├── state-manager.ts
│       ├── deny-list.ts
│       └── utils.ts
├── skills/
│   └── ketchup.enforced.md
├── commands/
│   └── ketchup.md
└── tests/
    ├── linker.test.ts
    ├── merger.test.ts
    ├── root-finder.test.ts
    ├── gitignore-manager.test.ts
    └── fixtures/
        ├── mock-project/
        ├── mock-monorepo/
        └── mock-existing-claude/
```

---

## package.json

```json
{
  "name": "claude-ketchup",
  "version": "0.1.0",
  "description": "Husky-style hooks and skills management for Claude Code",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "claude-ketchup": "dist/bin/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "postinstall": "node dist/bin/postinstall.js",
    "preuninstall": "node dist/bin/preuninstall.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "yaml": "^2.3.0",
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0"
  },
  "files": ["dist/", "templates/", "scripts/", "skills/", "commands/"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Enforced Skills Format

```markdown
---
hook: SessionStart # or array: [SessionStart, UserPromptSubmit]
priority: 100 # Higher runs first (default: 0)
modes: [plan, code] # Optional mode filter
conditions:
  state:
    autoContinue: smart # Check state.json values
---

# Skill Content Here
```

---

## Gitignore Strategy

`.claude/.gitignore` (generated by package):

```gitignore
# Managed by claude-ketchup - DO NOT EDIT THIS FILE

# Ignore generated/runtime files
settings.json
settings.json.lock
state.json
state.json.bak
logs/
_backup/

# Ignore local overrides (personal, not shared)
settings.local.json
deny-list.local.txt
*.local.*
*.local.md

# Ignore symlinks (they point to node_modules, which is gitignored)
# These are recreated on pnpm install
skills/ketchup.enforced.md
skills/tcr.skill.md
commands/ketchup.md
scripts/

# Allow project configs (tracked in git)
# !settings.project.json
# !deny-list.project.txt
# Team skills/commands without .local. in name are tracked
```

**Note:** With file-level symlinks, the gitignore explicitly lists package symlinks. This is regenerated on each install based on package contents.

---

## Verification Checklist

### Phase 1: Linker

- [ ] Fresh install on Mac creates symlinks correctly
- [ ] Fresh install on Linux creates symlinks correctly
- [ ] Fresh install on Windows creates junctions correctly
- [ ] Reinstall is idempotent (no duplicates, no churn)
- [ ] Existing non-symlink directory is backed up to `_backup/`
- [ ] Monorepo: root install works
- [ ] Monorepo: nested package install works
- [ ] Non-git project: graceful skip of gitignore

### Phase 2: Merger

- [ ] Package-only merge produces valid settings.json
- [ ] Project override merges correctly (Package → Project)
- [ ] Local override merges correctly (Package → Project → Local)
- [ ] `_disabled` removes specific hooks
- [ ] `mode: replace` fully overrides matcher
- [ ] Dedupe removes duplicate commands
- [ ] Lock file prevents unnecessary re-merge
- [ ] Source change triggers re-merge

### Phase 3: Runtime

- [ ] SessionStart hook fires and outputs skills
- [ ] PreToolUse hook blocks denied paths
- [ ] Skills frontmatter parsing works
- [ ] Skills conditions filter correctly
- [ ] Token budget truncates with warning
- [ ] Session deduplication prevents double injection
- [ ] Hook failure doesn't crash other hooks

### Phase 4: CLI

- [ ] `npx claude-ketchup status` works
- [ ] `npx claude-ketchup repair` fixes broken symlinks
- [ ] `npx claude-ketchup doctor` detects issues
- [ ] `npx claude-ketchup skills` lists all skills
- [ ] `/ketchup` command works in Claude Code

---

## Migration from Existing Setup

1. Install: `pnpm install claude-ketchup` (or `npm install` / `yarn add`)
2. Move custom skills from CLAUDE.md to `.claude/skills/*.enforced.md` (team) or `.claude/skills/*.local.md` (personal)
3. Add project config to `.claude/settings.project.json`
4. Add deny patterns to `.claude/deny-list.project.txt`
5. Commit project files:
   ```bash
   git add .claude/settings.project.json .claude/deny-list.project.txt .claude/skills/
   git commit -m "Add claude-ketchup project config"
   ```

---

## Quick Start

```bash
# Install (pnpm recommended, npm/yarn also work)
pnpm install claude-ketchup

# Verify
pnpm claude-ketchup status

# Customize for your team
echo '{"_disabled": []}' > .claude/settings.project.json
echo '*.env*' > .claude/deny-list.project.txt
git add .claude/settings.project.json .claude/deny-list.project.txt
git commit -m "Add claude-ketchup project config"
```

---

## Development Workflow (TDD)

This package is built using the Ketchup technique - true TDD:

```bash
# Link for local development
cd /Users/sam/code/auto/claude-ketchup
pnpm link --global

# In a test project
cd /path/to/test-project
pnpm link --global claude-ketchup

# Run tests continuously during development
pnpm test:watch
```

**TDD cycle for each feature:**

1. Write a failing test
2. Implement minimum code to pass
3. Refactor if needed
4. Commit when green

---

## Critical Files to Implement

| File                           | Purpose                         |
| ------------------------------ | ------------------------------- |
| `src/root-finder.ts`           | Project root detection          |
| `src/linker.ts`                | Cross-platform symlink creation |
| `src/merger.ts`                | Three-tier settings merge       |
| `src/gitignore-manager.ts`     | Generate `.claude/.gitignore`   |
| `bin/postinstall.ts`           | npm postinstall entry           |
| `bin/preuninstall.ts`          | npm preuninstall cleanup        |
| `bin/cli.ts`                   | CLI commands                    |
| `scripts/lib/state-manager.ts` | State CRUD with backup          |
| `scripts/lib/skills-loader.ts` | Enforced skills loader          |
| `scripts/lib/deny-list.ts`     | Deny list checker               |
| `templates/settings.json`      | Base hook configuration         |
| `skills/ketchup.enforced.md`   | Core ketchup technique          |
| `commands/ketchup.md`          | `/ketchup` command              |

---

## Repo Location

`/Users/sam/code/auto/claude-ketchup`

---

## Reference Specification

Full implementation details with code snippets: `/Users/sam/code/auto/xolvo/claude-ketchup.spec.md`
