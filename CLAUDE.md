# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Claude Auto — a Husky-style hooks and skills management system for Claude Code that enforces the Ketchup Technique (TDD-driven TCR discipline). It validates commits, injects reminders, manages deny-lists, and enables trusted parallel feature development.

## Commands

```bash
pnpm build            # TypeScript compile + esbuild bundle scripts
pnpm test             # Vitest (single run)
pnpm test:watch       # Vitest watch mode
pnpm type-check       # tsc --noEmit
pnpm lint             # Biome check
pnpm lint:fix         # Biome auto-fix
pnpm format           # Biome format --write
pnpm check            # Full CI: build + type-check + test + lint
```

Run a single test file:
```bash
pnpm vitest run src/hooks/validate-commit.test.ts
```

## Code Quality Requirements

- **100% test coverage** enforced via vitest thresholds (lines, functions, branches, statements). No escape hatches. Coverage excludes `src/**/*.test.ts` and `src/index.ts` (barrel exports only).
- **Biome linting**: `useImportType: error`, `noUnusedImports: error`, `noExplicitAny: warn`. Max cognitive complexity 15 (20 in tests). Line width 120, single quotes, semicolons, trailing commas.
- **Conventional commits required** with scope: `type(scope): subject`. Valid types: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`. Valid scopes: `cli|hooks|skills|core|docs|global|ci|release`.

## Architecture

### Hook System

Claude Code hooks are the core integration. Four hook points with bundled scripts in `scripts/`:

| Hook | Script | Purpose |
|------|--------|---------|
| SessionStart | `session-start.ts` | Load and inject reminders |
| PreToolUse | `pre-tool-use.ts` | Validate commits, enforce deny-list |
| UserPromptSubmit | `user-prompt-submit.ts` | Inject context-aware reminders |
| Stop | `auto-continue.ts` | Decide auto-continue vs stop |

Scripts are bundled via esbuild to `dist/bundle/scripts/` and symlinked into `.claude-auto/scripts/` on install.

### Key Source Modules (`src/`)

- **`hooks/`** — Hook handlers: `session-start.ts`, `pre-tool-use.ts`, `user-prompt-submit.ts`, `auto-continue.ts`, `validate-commit.ts`
- **`cli/`** — Commander.js CLI: `install.ts`, `status.ts`, `doctor.ts`, `repair.ts`, `reminders.ts`, `tui/` (terminal UI)
- **`commit-validator.ts`** — Batched validator execution (default batch size: 3), appeals parsing, Claude CLI spawning
- **`validator-loader.ts`** / **`reminder-loader.ts`** — Load markdown files with YAML frontmatter from `.claude-auto/validators/` and `.claude-auto/reminders/`
- **`hook-state.ts`** — Manages `.claude.hooks.json` (autoContinue mode, validateCommit mode, deny-list config)
- **`deny-list.ts`** — File path protection via micromatch glob patterns
- **`settings-merger.ts`** — Deep merges `templates/settings.json` + `.claude/settings.project.json` + `.claude/settings.local.json`
- **`clue-collector.ts`** — Extracts signals from session transcripts for auto-continue decisions
- **`subagent-classifier.ts`** — Classifies prompts as explore/work/unknown to control hook behavior

### Data Flow: Commit Validation

1. PreToolUse hook detects `git commit` command
2. Gets staged diff, files, commit message
3. Loads validators from `.claude-auto/validators/` (markdown with YAML frontmatter)
4. Batches validators (3 per Claude CLI call), each returns ACK or NACK
5. If NACK and commit message contains `[appeal: reason]`, runs appeal validator
6. Returns allow/block decision

### Validators and Reminders

Both are markdown files with YAML frontmatter. Validators gate commits (ACK/NACK decisions). Reminders inject context into prompts based on matching conditions (`hook`, `mode`, `toolName`, `priority`).

### Installation Model

`npx claude-auto install` copies validators, reminders, and bundled scripts into `.claude-auto/`, creates `.claude/settings.json` from templates, and initializes `.claude.hooks.json` state.

## Coding Patterns

- **Dependency injection** for testability: executor functions passed as params (e.g., `validateCommit(validators, context, executor = spawnAsync)`)
- **Async/await** throughout, no `.then()` chains
- **Absolute paths** everywhere, no relative path assumptions
- **Module naming conventions**: `*-loader.ts` (disk I/O), `*-manager.ts` (state), `*-classifier.ts` (categorization), `*-collector.ts` (aggregation), `*-logger.ts` (logging)
- **Tests**: co-located as `*.test.ts`, use temp directories for file I/O, mock executors via injection, whole-object assertions preferred
