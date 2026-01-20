# Ketchup Plan: claude-ketchup npm package

## TODO

### Bottle: Advanced Settings Merger

- [x] Burst 26: mergeSettings loads settings.project.json and deep merges
- [x] Burst 27: mergeSettings loads settings.local.json and deep merges (246e25a)
- [x] Burst 28: mergeSettings handles _disabled array to remove specific hooks (9b98f74)
- [x] Burst 29: mergeSettings handles mode: replace for full override (1d6bb02)
- [x] Burst 30: mergeSettings dedupes hooks by command within each matcher (cab82ca)
- [x] Burst 31a: lock file created and skips merge when hash matches (da37d5e)
- [x] Burst 31b: re-merges when lock file hash differs (3e9c2c7)

### Bottle: Runtime Hooks - State Manager

- [x] Burst 32: state-manager reads state.json (70f8db9)
- [x] Burst 33: state-manager writes state.json (1cf1950)
- [x] Burst 34: state-manager creates backup before write (72303b5)

### Bottle: Runtime Hooks - Skills Loader

- [x] Burst 35: skills-loader scans skills directories (39d07d9)
- [x] Burst 36: skills-loader parses YAML frontmatter (0a5dcb4)
- [x] Burst 37: skills-loader filters by hook type (2b6acee)
- [x] Burst 38: skills-loader filters by mode (plan/code) (f90322e)
- [x] Burst 39: skills-loader filters by state conditions (5016191)
- [x] Burst 40: skills-loader sorts by priority (f9a10e1)

### Bottle: Runtime Hooks - Deny List

- [x] Burst 41: deny-list loads patterns from deny-list.project.txt (d4c2748)
- [x] Burst 42: deny-list loads patterns from deny-list.local.txt (08b9419)
- [x] Burst 43: deny-list checks paths against patterns (c630aae)

### Bottle: Runtime Hooks - Hook Scripts

- [x] Burst 44: session-start.ts outputs filtered skills (c582a3b)
- [x] Burst 45: pre-tool-use.ts blocks denied paths (3a1e9b3)
- [x] Burst 46: user-prompt-submit.ts injects reminders (092fcf8)

### Bottle: CLI

- [x] Burst 47: `claude-ketchup status` shows symlink status (914bf73)
- [x] Burst 48a: repair recreates symlinks for specified files (7a1d424)
- [x] Burst 48b: getExpectedSymlinks finds files in package directories (9ad0e84)
- [x] Burst 49: `claude-ketchup doctor` diagnoses symlink health (6f4f1b3)
- [x] Burst 50: `claude-ketchup skills` lists skills with metadata (69c7019)
- [x] Burst 51: `/ketchup` command definition (c593a6d)

### Bottle: Templates & Polish

- [x] Burst 52: Create templates/settings.json with default hooks (347afa1)
- [x] Burst 53: Create scripts/session-start.ts hook script (0dc1826)
- [x] Burst 54: Create scripts/pre-tool-use.ts hook script (8c1e09e)
- [x] Burst 55: Create scripts/user-prompt-submit.ts hook script (193844e)
- [x] Burst 56: Create skills/ketchup.enforced.md (689994a)
- [x] Burst 57: E2E test - all tests passing (104e8d6)

### Bottle: Hook Behavior E2E Tests

- [x] Burst 58-65: Create test-hooks.sh with all E2E hook tests (ff57d1d)
- [x] Burst 66: Add sub-agent E2E tests (deny-list inheritance, state persistence, skipModes) (8036dc9)


## DONE

- [x] Burst 1: Setup package infrastructure (package.json, tsconfig, vitest)
- [x] Burst 2: findProjectRoot uses KETCHUP_ROOT env var
- [x] Burst 3: findProjectRoot uses INIT_CWD when not in node_modules (cc4cf54)
- [x] Burst 4+6: findProjectRoot walks up to find package.json with cwd fallback (0f8fdf3)
- [x] Burst 5: findProjectRoot walks up to find .git (d199531)
- [x] Burst 7: getPackageDir returns package directory (6914505)
- [x] Burst 8: isLinkedMode detects pnpm link (2343208)
- [x] Burst 9: createSymlink creates file symlink (f781b24)
- [x] Burst 10+11: createSymlink handles existing files and symlinks (0b3ae5f)
- [x] Burst 12: createSymlink is idempotent (2bb9aae)
- [x] Burst 13: removeSymlink removes symlink but not real files (42d35ab)
- [x] Burst 14: verifySymlink checks symlink target (7292bed)
- [x] Burst 15: generateGitignore creates .gitignore file (a5020b1)
- [x] Burst 16: gitignore includes symlinked files (8194ed2)
- [x] Burst 17: gitignore includes *.local.* pattern (64510ab)
- [x] Burst 18: gitignore includes runtime file patterns (b71e307)
- [x] Burst 19: postinstall detects project root (99e064e)
- [x] Burst 20: postinstall creates .claude directory (7f5f206)
- [x] Burst 21: postinstall symlinks scripts/, skills/, commands/ files (0837768)
- [x] Burst 22: postinstall generates gitignore (4e624d5)
- [x] Burst 23: postinstall merges settings (b6b245e)
- [x] Burst 24+25: preuninstall removes symlinks, preserves local files (8aa2d24)
- [x] Infrastructure: bin scripts and E2E test (3d85f62)
