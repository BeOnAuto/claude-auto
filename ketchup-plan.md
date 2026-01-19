# Ketchup Plan: claude-ketchup npm package

## TODO
- [ ] Burst 7: getPackageDir returns package directory
- [ ] Burst 8: isLinkedMode detects pnpm link
- [ ] Burst 9: createSymlink creates file symlink on Unix
- [ ] Burst 10: createSymlink backs up existing non-symlink file
- [ ] Burst 11: createSymlink replaces existing symlink
- [ ] Burst 12: createSymlink is idempotent
- [ ] Burst 13: removeSymlink removes symlink but not real files
- [ ] Burst 14: verifySymlink checks symlink target

## DONE

- [x] Burst 1: Setup package infrastructure (package.json, tsconfig, vitest)
- [x] Burst 2: findProjectRoot uses KETCHUP_ROOT env var
- [x] Burst 3: findProjectRoot uses INIT_CWD when not in node_modules (cc4cf54)
- [x] Burst 4+6: findProjectRoot walks up to find package.json with cwd fallback (0f8fdf3)
- [x] Burst 5: findProjectRoot walks up to find .git (d199531)
