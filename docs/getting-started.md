# Become the System Architect

In 5 minutes, you'll transform from AI Janitor to System Architect.

**What you'll accomplish:**

- Install the Quality Stack
- See the supervisor system in action
- Create your first skill (context injection)
- Set up file protection

---

## Prerequisites

- Node.js 18.0.0+
- A project you're tired of cleaning up after AI

---

## Step 1: Install the Quality Stack

```bash
pnpm add -D claude-ketchup
```

Or with npm:

```bash
npm install claude-ketchup
```

Behind the scenes, claude-ketchup:

- Injects hooks that validate every commit
- Creates skills that inject your guidelines
- Sets up the supervisor that ACKs or NACKs changes
- Merges settings with smart overrides

---

## Step 2: Verify Your Transformation

```bash
claude-ketchup doctor
```

All green? You're now the architect.

---

## Step 3: Explore What Was Created

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

## Step 4: Feed the System

Create your first skill to inject YOUR rules into every session:

```bash
cat > .claude/skills/my-project.md << 'EOF'
---
hook: SessionStart
priority: 50
---

# My Project Guidelines

- TDD: Test first, code second
- One test, one behavior, one commit
- No comments in code
EOF
```

Now every Claude session starts with YOUR rules.

---

## Step 5: Protect Your Files

Define what the AI cannot touch:

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

The supervisor will block any attempt to modify these files.

---

## Step 6: Watch the System Work

Start a Claude Code session. The supervisor will:

1. **Inject** your guidelines at session start
2. **Validate** every commit against your rules
3. **ACK** clean commits, **NACK** rule violations

You review. You don't repair.

---

## What Just Happened?

You installed the Quality Stack:

| Component             | What It Does                  | You Just Enabled        |
| --------------------- | ----------------------------- | ----------------------- |
| Auto-Planning         | AI plans before coding        | ketchup-plan.md support |
| Supervisor Validation | ACK/NACK every commit         | PreToolUse hooks        |
| Context Injection     | Your rules, every session     | SessionStart skills     |
| File Protection       | Deny-list for sensitive files | PreToolUse deny-list    |

---

## Customize Settings (Optional)

Override default hook behavior with project settings:

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

Or completely replace a hook:

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

- [The Quality Stack](/ketchup-technique) - Understand the full methodology
- [Hooks Guide](/hooks-guide) - Customize your supervision
- [Origin Story](/origin-story) - Why this approach works

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
