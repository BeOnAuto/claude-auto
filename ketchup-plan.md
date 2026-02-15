# Ketchup Plan: Fix spawnAsync inheriting CLAUDECODE env var

## TODO

(none)

## DONE

- [x] Burst 1: spawnAsync strips CLAUDECODE from child process env [depends: none]

## Previous Phase: Skip Reminders for Validator Subagents (Phase 2)

- [x] Burst 1: Add agent_type to HookInput type [depends: none]
- [x] Burst 2: Create .claude-auto/agents/validator.md agent definition [depends: none]
- [x] Burst 3: Update commit-validator.ts to pass --agent validator [depends: none]
- [x] Burst 4: Update handleSessionStart to check agent_type instead of prompt [depends: 1]
- [x] Burst 5: Update install.ts to copy agents/ directory [depends: 2]

## Phase 1 (Previous)

- [x] Burst 1: Create isValidatorSession function that detects validator prompts [depends: none]
- [x] Burst 2: Update handleSessionStart to skip reminders when isValidatorSession returns true [depends: 1]
- [x] Burst 3: Update handleUserPromptSubmit to skip reminders when isValidatorSession returns true [depends: 1]
