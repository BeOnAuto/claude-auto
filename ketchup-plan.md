# Ketchup Plan: TCR Automation with Safety Guardrails

## TODO

### Coverage: Bring all coverage metrics to 100%

- [ ] Burst C1: Remove dead code in log-tailer.ts + add coverage tests [depends: none]
- [ ] Burst C2: Export install.ts helpers + add coverage tests [depends: none]
- [ ] Burst C3: Remove dead branch in auto-continue.ts + add coverage tests [depends: none]
- [ ] Burst C4: Remove dead branch in pre-tool-use.ts + add coverage tests [depends: none]
- [ ] Burst C5: Add commit-validator.test.ts branch coverage tests [depends: none]
- [ ] Burst C6: Rewrite cli.test.ts for full coverage [depends: none]
- [ ] Burst C7: Add validator-loader.test.ts + tui.test.ts coverage tests [depends: none]
- [ ] Burst C8: Fix remaining commit-validator.ts branch coverage gaps [depends: C5]

### Feature 1: Dangerous Bash Command Detection

- [ ] Burst 1.1: Add tests for dangerous command pattern detection (rm -rf /, sudo rm, etc.)
- [ ] Burst 1.2: Implement dangerous command matcher with pattern logic
- [ ] Burst 1.3: Add tests for safe command patterns (rm -rf node_modules, ./relative)
- [ ] Burst 1.4: Integrate dangerous command check into PreToolUse hook
- [ ] Burst 1.5: Add tests for PreToolUse hook blocking dangerous Bash commands
- [ ] Burst 1.6: Document dangerous commands in /docs/safety/dangerous-commands.md

### Feature 2: PostToolUse Auto-Test + TDD-Aware TCR

#### Test State Management
- [ ] Burst 2.1: Add tests for test-state module (read/write/update status)
- [ ] Burst 2.2: Implement test-state module with status tracking
- [ ] Burst 2.3: Add test state to hook-state schema with session tracking

#### Test Runner
- [ ] Burst 2.4: Add tests for test-runner module (execute command, capture output)
- [ ] Burst 2.5: Implement test-runner with timeout and error handling
- [ ] Burst 2.6: Add tests for test-file-mapper (source → test file resolution)
- [ ] Burst 2.7: Implement test-file-mapper with naming conventions

#### TCR Executor (TDD-Aware Decision Logic)
- [ ] Burst 2.8: Add tests for TCR decision matrix (failing→failing = skip, etc.)
- [ ] Burst 2.9: Implement tcr-executor with TDD state-aware decisions
- [ ] Burst 2.10: Add tests for git commit automation (add + commit with message)
- [ ] Burst 2.11: Implement git commit logic in tcr-executor
- [ ] Burst 2.12: Add tests for git revert automation (checkout -- .)
- [ ] Burst 2.13: Implement git revert logic in tcr-executor

#### PostToolUse Hook Integration
- [ ] Burst 2.14: Add tests for post-tool-use hook handler (integration tests)
- [ ] Burst 2.15: Implement post-tool-use.ts hook script
- [ ] Burst 2.16: Add autoTest config to hook-state schema
- [ ] Burst 2.17: Update templates with PostToolUse hook configuration
- [ ] Burst 2.18: Document PostToolUse behavior with TDD cycle examples in /docs/hooks/post-tool-use.md

### Feature 3: CLI Health Check (Current Session)

- [ ] Burst 3.1: Add tests for log parser (parse hook logs, extract errors)
- [ ] Burst 3.2: Implement log parser with session filtering
- [ ] Burst 3.3: Add tests for health check formatter (output generation)
- [ ] Burst 3.4: Implement health check formatter with counts and failures
- [ ] Burst 3.5: Add tests for health CLI command integration
- [ ] Burst 3.6: Implement health.ts CLI command handler
- [ ] Burst 3.7: Register health command in CLI index
- [ ] Burst 3.8: Document health command usage in /docs/cli/health.md

## DONE

- [x] Bug Fix: Remove --no-session-persistence flag from Claude CLI calls (65bbb0e)
- [x] Burst 1: Add `parseBatchedOutput` tests + `claudeBatchJson` helper (6632386)
- [x] Burst 2: Rewrite `validateCommit` tests for batched execution (3394e6a)
- [x] Burst 3: Rewrite `handleCommitValidation` tests for batched format (3394e6a)
- [x] Burst 4: Update `pre-tool-use.test.ts` mocks to batched format (3394e6a)
- [x] Burst 5: Add `batchCount` to hook-state (194b1c0)
- [x] Burst 6: Wire `batchCount` through `validateCommit` (25f88c0)
