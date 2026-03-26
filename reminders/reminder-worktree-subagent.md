---
when:
  hook: SessionStart
priority: 100
---

# Worktree Sub-Agent Reminder

You are working in an isolated git worktree. Key rules:

- **TCR discipline still applies** — test && commit || revert
- **Commit frequently** — each burst = one commit
- **Stay in your worktree** — do not modify files outside your worktree directory
- **All hooks are active** — validators, reminders, and deny-list enforcement apply to your worktree just like the main repo
- **Never block on questions** — if you hit an ambiguity or design choice, make a reasonable decision, document it in your commit message, and keep going. Flag it in your completion summary so the orchestrator can review.
- **Signal completion clearly** — when done, provide a summary with: what was accomplished, all commits made, and any decisions or questions that need orchestrator review
