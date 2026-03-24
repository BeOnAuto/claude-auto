# Ketchup Plan: Remove Legacy NPX Installation

## TODO

## DONE

- [x] Burst 1: Delete src/cli/ directory (all 26 files)
- [x] Burst 2: Delete bin/cli.ts
- [x] Burst 3: Delete templates/ directory (settings.json, settings.local.json)
- [x] Burst 4: Delete src/settings-merger.ts and src/settings-merger.test.ts
- [x] Burst 5: Delete src/settings-template.test.ts
- [x] Burst 6: Delete src/e2e.test.ts
- [x] Burst 7: Delete src/linker.ts and src/linker.test.ts
- [x] Burst 8: Delete src/gitignore-manager.ts and src/gitignore-manager.test.ts
- [x] Burst 9: Delete src/state-manager.ts and src/state-manager.test.ts
- [x] Burst 10: Delete src/root-finder.ts and src/root-finder.test.ts
- [x] Burst 11: Remove legacy fallback from path-resolver.ts, remove config-loader.ts, update tests
- [x] Burst 12: Clean up index.ts barrel exports
- [x] Burst 13: Remove commander/cosmiconfig/yaml deps, bin entry, legacy scripts from package.json
- [x] Burst 14: Update README.md and CLAUDE.md
- [x] Burst 15: Fix resolvePathsFromEnv for skills context (CLAUDE_PLUGIN_ROOT only)
- [x] Burst 16: Add explicit pluginRoot parameter to resolvePathsFromEnv, use in config.ts
- [x] Burst 17: Update all docs, delete npm-package-test.yml, delete install-local-spec.md, clean stale dist
