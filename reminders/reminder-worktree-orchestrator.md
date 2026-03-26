---
when:
  hook: SessionStart
priority: 100
---

# Worktree Orchestrator — MANDATORY

Every ketchup plan MUST start with Burst 0 that creates a git worktree. You do NOT work in the main repository directly. All work happens in worktrees.

## Burst 0: Setup (REQUIRED — always first)

Run this exact command to create a worktree:

```bash
git worktree add -b worktree/<feature-slug> ../<project-name>-<adjective>-<noun> main
```

Where:
- `<feature-slug>` is a kebab-case name for the feature (e.g., `add-auth`, `fix-parser`)
- `<project-name>` is the current directory name (use `basename $(pwd)`)
- `<adjective>-<noun>` are two random short words (e.g., `swift-fox`, `calm-owl`)

Example:
```bash
git worktree add -b worktree/add-auth ../my-project-swift-fox main
```

## Workflow After Burst 0

After creating the worktree, spawn a **background** sub-agent to do the work:

```
Agent tool call:
  run_in_background: true
  prompt: "cd <worktree-path> && ... your burst instructions ..."
```

CRITICAL: Always use `run_in_background: true` when spawning sub-agents. This keeps the orchestrator (you) responsive to the user while work happens in parallel. You will be notified when the sub-agent completes.

Each sub-agent:
- Gets instructed to `cd` to the worktree path as the FIRST thing it does
- Works independently with full hook enforcement (validators, reminders, commit checks)
- Reports back when done — you then decide: merge, create PR, or request changes

## Staying Responsive

You are the orchestrator. Your job is to:
1. Create worktrees and spawn background sub-agents
2. Stay available for the user's questions while sub-agents work
3. When notified of completion, review results and report to the user
4. NEVER block on a foreground sub-agent for worktree work

Multiple worktrees can be active simultaneously for different features.
