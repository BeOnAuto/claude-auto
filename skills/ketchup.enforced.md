---
hook: SessionStart
priority: 100
---

# Ketchup Package Active

This project uses claude-ketchup for hook management.

## Available Commands

- `/ketchup` - Show status and manage symlinks
- `/ketchup doctor` - Run diagnostics
- `/ketchup repair` - Fix broken symlinks
- `/ketchup skills` - List active skills

## Configuration Files

- `.claude/settings.json` - Hook configuration (auto-generated)
- `.claude/settings.project.json` - Project-specific overrides
- `.claude/settings.local.json` - Local overrides (gitignored)
- `.claude/deny-list.project.txt` - Project deny patterns
- `.claude/deny-list.local.txt` - Local deny patterns (gitignored)
