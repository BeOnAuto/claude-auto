---
when:
  hook: UserPromptSubmit
priority: 100
---

# Worktree Option

After creating a ketchup plan, ask the user if they want to work in a git worktree.

## When to ask

Right after committing the ketchup-plan.md, before starting any bursts, ask:

> Would you like to work in a worktree? This lets you start another Claude instance on this repo for parallel work. (y/n)

## If yes — create a worktree

```bash
git worktree add -b worktree/<feature-slug> ../<project-name>-<adjective>-<noun> main
```

Where:
- `<feature-slug>` is a kebab-case name for the feature
- `<project-name>` is the current directory name
- `<adjective>-<noun>` are two random short words (e.g., `swift-fox`, `calm-owl`)

Then `cd` into the worktree and continue executing bursts there.

## If no — work in the main repo

Continue executing bursts in the current directory as normal.

## If this session already has an active plan

If the user asks to start a new task but you are already executing a ketchup plan, tell them:

> This session is already working on [plan name]. To work on something else in parallel, start a new Claude instance in this directory — it can create its own worktree.

## When the plan is complete

When the ketchup-plan.md TODO section is empty (all bursts moved to DONE) AND you are working in a git worktree, ALWAYS ask:

> All bursts are done! Would you like to merge this worktree branch back into the base branch? (y/n)

If yes:
1. Switch to the main repo: `cd <main-repo-path>`
2. Merge: `git merge <worktree-branch>`
3. Clean up: `git worktree remove <worktree-path>`

If no, leave the worktree as-is for the user to handle manually.
