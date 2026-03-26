---
name: worktree
description: Manage git worktrees for parallel development
---

# Worktree Management

Manage git worktrees for parallel feature development.

## Commands

- `list` — Show all tracked worktrees and their status
- `status <id>` — Check health of a specific worktree
- `create <branch> [--base <branch>] [--path <path>]` — Create a new worktree
- `remove <id>` — Remove a worktree and clean up
- `merge <id>` — Merge worktree branch back to base

## Usage

Run the worktree management script to handle the requested operation. Parse the user's input to determine which command to execute.

For `list`: Read worktree state and display all tracked worktrees.
For `status`: Check if the worktree path exists and display its info.
For `create`: Use the worktree manager to create a new worktree.
For `remove`: Use the worktree manager to remove a worktree.
For `merge`: Output the git merge command for the worktree's branch.
