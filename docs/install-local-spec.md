# `install:local` — Local Dev Install

## Goal

An npm script (`pnpm install:local`) for package maintainers that installs ketchup into this repo itself, wiring hooks to run directly from source via `tsx` — no build step needed. Changes to hook scripts, reminders, and validators take effect immediately.

## Requirements

1. **Hooks run from source**: `.claude/settings.json` commands use `pnpm tsx scripts/<name>.ts` instead of `node .ketchup/scripts/<name>.js`

2. **No copying reminders/validators**: The normal install copies from `reminders/` and `validators/` into `.ketchup/`. Local install skips this — `.ketchup/reminders/` and `.ketchup/validators/` ARE the source. You edit them in-place and they become what gets published.

3. **Everything else same as `npx claude-ketchup install`**:
   - Creates `.claude/` dir
   - Writes `.claude/settings.json` (with tsx commands)
   - Copies `commands/` to `.claude/commands/`
   - Initializes `.ketchup/.claude.hooks.json` with defaults (if not exists)

4. **Shows install vs update messaging**: Same as normal install — "installing" on fresh, "already installed, updating" when scripts exist.

5. **`.claude/` is gitignored** — local install output won't pollute the repo.

## Current Architecture

- Entry scripts: `scripts/session-start.ts`, `scripts/pre-tool-use.ts`, `scripts/user-prompt-submit.ts`, `scripts/auto-continue.ts`
- Normal install bundles these via esbuild into `dist/bundle/scripts/` then copies to `.ketchup/scripts/`
- Hooks resolve `ketchupDir` from `claudeDir` via `resolvePaths()` (uses cosmiconfig, defaults to `.ketchup`)
- `install()` in `src/cli/install.ts` returns `{ targetDir, claudeDir, settingsCreated, status }`
