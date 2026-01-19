# Ketchup Plan: claude-ketchup npm package

## TODO

- [ ] Burst 16: gitignore lists symlinked files from package
- [ ] Burst 17: gitignore ignores *.local.* pattern
- [ ] Burst 18: gitignore ignores runtime files (state.json, logs/, etc.)

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
