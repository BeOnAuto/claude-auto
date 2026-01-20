# Getting Started with claude-ketchup

This tutorial walks you through installing claude-ketchup and using it to manage Claude Code hooks in your project.

**Time required:** ~5 minutes

---

## Prerequisites

- Node.js 18.0.0 or later
- npm, pnpm, or yarn
- A project with a `package.json`

---

## Step 1: Install the Package

```bash
pnpm add claude-ketchup
```

Or with npm:

```bash
npm install claude-ketchup
```

During installation, claude-ketchup automatically runs its postinstall script, which creates the `.claude/` directory structure.

---

## Step 2: Verify Installation

Check that everything was set up correctly:

```bash
claude-ketchup doctor
```

You should see output indicating all symlinks are healthy.

---

## Step 3: Explore the Created Structure

Look at what was created:

```bash
ls -la .claude/
```

You should see:

```
.claude/
├── scripts/           # Hook scripts (symlinked)
├── skills/            # Skill files (symlinked)
├── commands/          # Command definitions (symlinked)
├── settings.json      # Merged Claude configuration
└── .gitignore         # Ignores symlinks and runtime files
```

---

## Step 4: Create Your First Skill

Skills inject context into Claude sessions. Create a project-specific skill:

```bash
cat > .claude/skills/my-project.md << 'EOF'
---
hook: SessionStart
priority: 50
---

# My Project Guidelines

- Use TypeScript strict mode
- Follow TDD principles
- Write tests before implementation
EOF
```

This skill will be loaded every time a Claude Code session starts.

---

## Step 5: Set Up a Deny-List

Protect sensitive files from being modified:

```bash
cat > .claude/deny-list.project.txt << 'EOF'
# Secrets
.env
*.secret
credentials.json

# Generated
dist/**
coverage/**
EOF
```

Now Claude won't be able to edit files matching these patterns.

---

## Step 6: Customize Settings (Optional)

Override default hook behavior with project settings. For example, to disable commit validation:

```bash
cat > .claude/settings.project.json << 'EOF'
{
  "hooks": {
    "PreToolUse": {
      "_disabled": ["npx tsx .claude/scripts/validate-commit.ts"]
    }
  }
}
EOF
```

Or to completely replace the SessionStart hook:

```bash
cat > .claude/settings.project.json << 'EOF'
{
  "hooks": {
    "SessionStart": {
      "_mode": "replace",
      "_value": []
    }
  }
}
EOF
```

---

## Next Steps

- [Learn about hooks in depth](./hooks-guide.md)
- [Read the API reference](./api-reference.md)
- [Understand the architecture](./architecture.md)

---

## Troubleshooting

### "Cannot find module" errors

Ensure you're using Node.js 18+:

```bash
node --version
```

### Symlinks not created

Run repair:

```bash
claude-ketchup repair
```

### Hooks not firing

Check settings:

```bash
cat .claude/settings.json
```

Verify the hooks section contains the expected commands.
