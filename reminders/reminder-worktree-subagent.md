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
- **Signal completion clearly** — when your task is done, summarize what was accomplished and list all commits made
- **All hooks are active** — validators, reminders, and deny-list enforcement apply to your worktree just like the main repo
