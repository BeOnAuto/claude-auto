# /ketchup - Ketchup Status & Control

Check the status of your claude-ketchup installation and manage symlinks.

## Commands

### `/ketchup` or `/ketchup status`

Show the current status of all managed symlinks.

### `/ketchup doctor`

Run diagnostics to check for issues with the installation.

### `/ketchup repair`

Fix any broken or missing symlinks.

### `/ketchup skills`

List all active skills with their metadata.

## Implementation

When the user runs `/ketchup <command>`, you should:

1. Determine the package directory (node_modules/claude-ketchup)
2. Determine the .claude directory (project root/.claude)
3. Run the appropriate command function
4. Display the results

### Response Format

**For `/ketchup status`:**

```
╭─────────────────────────────────────────╮
│         🥫 Ketchup Status               │
├─────────────────────────────────────────┤
│  Symlinks:                              │
│    ✓ scripts/session-start.ts           │
│    ✓ scripts/pre-tool-use.ts            │
│    ✓ skills/coding.md                   │
├─────────────────────────────────────────┤
│  All symlinks healthy                   │
╰─────────────────────────────────────────╯
```

**For `/ketchup doctor`:**

```
╭─────────────────────────────────────────╮
│         🩺 Ketchup Doctor               │
├─────────────────────────────────────────┤
│  ✓ All symlinks valid                   │
│  ✓ Settings merged                      │
│  ✓ Gitignore updated                    │
├─────────────────────────────────────────┤
│  Status: Healthy                        │
╰─────────────────────────────────────────╯
```

**For `/ketchup repair`:**

```
╭─────────────────────────────────────────╮
│         🔧 Ketchup Repair               │
├─────────────────────────────────────────┤
│  Repaired:                              │
│    ↻ scripts/session-start.ts           │
│    ↻ skills/coding.md                   │
├─────────────────────────────────────────┤
│  2 symlinks repaired                    │
╰─────────────────────────────────────────╯
```

**For `/ketchup skills`:**

```
╭─────────────────────────────────────────╮
│         📚 Active Skills                │
├─────────────────────────────────────────┤
│  coding.md                              │
│    Hook: SessionStart                   │
│    Priority: 10                         │
│                                         │
│  reminder.md                            │
│    Hook: UserPromptSubmit               │
│    Priority: 5                          │
├─────────────────────────────────────────┤
│  2 skills active                        │
╰─────────────────────────────────────────╯
```

**For `/ketchup help`:**

```
/ketchup - Ketchup Status & Control

Commands:
  /ketchup              Show symlink status
  /ketchup status       Show symlink status
  /ketchup doctor       Run diagnostics
  /ketchup repair       Fix broken symlinks
  /ketchup skills       List active skills
  /ketchup help         Show this help
```
