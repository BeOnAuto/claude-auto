# Ketchup Plan: Fix cwd-based Resolution & Remove HookState Variability

## TODO

- [x] Burst 1: Add resolveClaudeDirFromScript to path-resolver [depends: none] (8d843c8)
- [x] Burst 2: Update 4 hook scripts to use __dirname [depends: 1] (3d72b69)
- [x] Burst 3: Remove volatile fields from HookState [depends: none] (d71265f)
- [ ] Burst 4: Add runtime.json to gitignore patterns [depends: none]
- [ ] Burst 5: Delete stale root .claude.hooks.json [depends: none]
- [ ] Burst 6: Rebuild and verify [depends: 1-5]

## DONE

- [x] Burst 1: Add CopyResult type to copyDir for tracking changes (a164689)
- [x] Burst 2: Add granular install update messaging with added/updated/removed tracking (bc061bd)

## Previous Phase: Fix spawnAsync inheriting CLAUDECODE env var

- [x] Burst 1: spawnAsync strips CLAUDECODE from child process env [depends: none]

## Phase 2: Skip Reminders for Validator Subagents

- [x] Burst 1: Add agent_type to HookInput type [depends: none]
- [x] Burst 2: Create .claude-auto/agents/validator.md agent definition [depends: none]
- [x] Burst 3: Update commit-validator.ts to pass --agent validator [depends: none]
- [x] Burst 4: Update handleSessionStart to check agent_type instead of prompt [depends: 1]
- [x] Burst 5: Update install.ts to copy agents/ directory [depends: 2]

## Phase 1: Validator Session Detection

- [x] Burst 1: Create isValidatorSession function that detects validator prompts [depends: none]
- [x] Burst 2: Update handleSessionStart to skip reminders when isValidatorSession returns true [depends: 1]
- [x] Burst 3: Update handleUserPromptSubmit to skip reminders when isValidatorSession returns true [depends: 1]
