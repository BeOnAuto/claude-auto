# Getting Started

Install the Quality Stack in 5 minutes.

**What you'll accomplish:**

- Install the Quality Stack
- See the supervisor system in action
- Create your first skill (context injection)
- Set up file protection
- Understand how to parallelize with git worktrees

---

## Prerequisites

- Node.js 18.0.0+
- A project where you want to parallelize AI execution

---

## Step 1: Install the Quality Stack

::: code-group

```bash [npm]
npm install -D claude-ketchup
```

```bash [yarn]
yarn add -D claude-ketchup
```

```bash [pnpm]
# --allow-build permits the postinstall script to set up .claude/
pnpm add -D claude-ketchup --allow-build=claude-ketchup
```

```bash [bun]
# --trust permits the postinstall script to set up .claude/
bun add -D claude-ketchup --trust claude-ketchup
```

:::

::: tip pnpm & Bun Security
Both pnpm v10+ and Bun block lifecycle scripts by default for security. The flags above (`--allow-build` for pnpm, `--trust` for bun) allow claude-ketchup's postinstall script to run, which sets up the `.claude` directory with hooks and skills.
:::

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

All green? The Quality Stack is active. You can now walk away.

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
4. **Auto-continue** until the plan is complete

You define. You release. You don't babysit.

---

## Step 7: Multiply with Git Worktrees

Git worktrees let you have multiple working directories from the same repo:

```bash
# Create worktrees for parallel features
git worktree add ../feature-auth feature/auth
git worktree add ../feature-payments feature/payments
git worktree add ../feature-dashboard feature/dashboard
```

Run a Ketchup instance in each worktree:

```bash
# Terminal 1 (feature-auth)
cd ../feature-auth
# Feed requirements, approve plan, start execution
# Ketchup running...

# Terminal 2 (feature-payments)
cd ../feature-payments
# Feed requirements, approve plan, start execution
# Ketchup running...

# Terminal 3 (feature-dashboard)
cd ../feature-dashboard
# Feed requirements, approve plan, start execution
# Ketchup running...
```

Three features running simultaneously. All quality-validated.

---

## What Just Happened?

You installed the Quality Stack:

| Component         | What It Does                  | You Just Enabled        |
| ----------------- | ----------------------------- | ----------------------- |
| Auto-Planner      | AI plans before coding        | ketchup-plan.md support |
| Supervisor AI     | ACK/NACK every commit         | PreToolUse hooks        |
| Context Injection | Your rules, every session     | SessionStart skills     |
| File Protection   | Deny-list for sensitive files | PreToolUse deny-list    |
| Auto-Continue     | AI works until plan complete  | Stop hooks              |

---

## The Transformation

| Before (Babysitter)              | After (Bionic)                   |
| -------------------------------- | -------------------------------- |
| Watching one AI session          | Directing multiple workstreams   |
| Nudging, correcting in real-time | Defining, approving, releasing   |
| Serial productivity              | Parallel productivity            |
| Marginal gains (1.5x)            | Multiplicative gains (5-10x)     |
| Brain captured by supervision    | Brain freed for the next thing   |

From Babysitter to Bionic.

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

- [Configuration Reference](/configuration) - All configuration options
- [The Quality Stack](/ketchup-technique) - Why you can walk away
- [Hooks Guide](/hooks-guide) - Configure your supervision
- [Origin Story](/origin-story) - The journey from babysitter to bionic

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
