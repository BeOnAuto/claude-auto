# Ketchup Plan: claude-ketchup npm package

## TODO

(Phase 1 complete!)


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
