# Ketchup Plan: Worktree-Based Orchestration

## TODO

- [ ] Burst 1: `src/worktree-detector.ts` — `.git` file vs directory detection [depends: none]
- [ ] Burst 2: `src/worktree-state.ts` — CRUD for `.worktrees.json` [depends: none]
- [ ] Burst 3: `src/hook-state.ts` — Add `WorktreeConfig` to state [depends: none]
- [ ] Burst 4: `src/path-resolver.ts` — Add `isWorktree`, `mainRepoRoot` [depends: 1]
- [ ] Burst 5: `src/worktree-manager.ts` — Worktree create/list/remove lifecycle [depends: 1, 2]
- [ ] Burst 6: `src/worktree-orchestrator.ts` — Prompt building, branch naming [depends: 2, 5]
- [ ] Burst 7: `src/hooks/session-start.ts` — Inject worktree context [depends: 4]
- [ ] Burst 8: `src/hooks/user-prompt-submit.ts` — Inject worktree status [depends: 2, 4]
- [ ] Burst 9: `src/subagent-classifier.ts` — Add `orchestrate` type [depends: none]
- [ ] Burst 10: Reminders + validators — New markdown files [depends: none]
- [ ] Burst 11: `scripts/worktree.ts` + skill — `/claude-auto:worktree` command [depends: 5]
- [ ] Burst 12: `src/index.ts` — Export new public interfaces [depends: all]

## DONE
