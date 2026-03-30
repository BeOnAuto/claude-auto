---
when:
  hook: SessionStart
priority: 100
---

# Worktree Session Reminder

If you are working in a git worktree (not the main repo):

- **TCR discipline still applies** — test && commit || revert
- **Commit frequently** — each burst = one commit
- **Stay in your worktree** — do not modify files outside your worktree directory
- **All hooks are active** — validators, reminders, and deny-list enforcement apply
- When done, tell the user to merge the worktree branch back or create a PR
