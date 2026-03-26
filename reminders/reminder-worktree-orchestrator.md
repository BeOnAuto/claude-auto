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

After creating the worktree, `cd` into it and do ALL subsequent work there.

## Workflow After Burst 0

1. `cd` into the worktree directory
2. Execute remaining bursts inside the worktree
3. Commit all work in the worktree (TCR discipline applies)
4. When done, return to the main repo and merge or create a PR

## For Parallel Work

Spawn sub-agents using the Agent tool (without `isolation: "worktree"`). Each sub-agent:
- Gets instructed to `cd` to its worktree path
- Works independently with full hook enforcement
- Reports back when done

Multiple worktrees can be active simultaneously for different features.
