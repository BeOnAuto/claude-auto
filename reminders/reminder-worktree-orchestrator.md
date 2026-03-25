---
when:
  hook: SessionStart
priority: 100
---

# Worktree Orchestrator Reminder

When creating a ketchup plan, always start with Burst 0: Setup — create a git worktree.

## Worktree Workflow

1. **Burst 0: Setup** — Create worktree at configured location (default: `../{project}-{adjective}-{noun}`)
2. Spawn sub-agent to work in the worktree using the Agent tool
3. Each sub-agent gets full hook enforcement (validators, reminders, commit checks)
4. When sub-agent completes, review output and decide: merge, create PR, or request changes

## Managing Multiple Worktrees

- Multiple worktrees can be active simultaneously
- Use `/claude-auto:worktree list` to see active worktrees
- Use `/claude-auto:worktree status <id>` to check health
- Surface questions from sub-agents to the user interactively

## Sub-Agent Prompt Pattern

When spawning a sub-agent for a worktree:
- Instruct it to `cd` to the worktree path
- Include the burst description and plan context
- Tell it which branch it is on and the base branch
