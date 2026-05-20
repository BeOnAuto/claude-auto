# Getting Started

Install Ketchup in 5 minutes.

**What you'll accomplish:**

- Install Ketchup
- See the supervisor system in action
- Create your first skill (context injection)
- Set up file protection
- Understand how to parallelize with git worktrees

---

## Prerequisites

- Claude Code installed
- A project where you want to parallelize AI execution

---

## Step 1: Install Ketchup

From within a Claude Code session:

```
/plugin marketplace add BeOnAuto/auto-plugins
/plugin install ketchup
```

Or for local development:

```bash
claude --plugin-dir /path/to/ketchup
```

Claude will mention that Ketchup is available but not yet active.

---

## Step 2: Activate in Your Project

```
/ketchup:init
```

This creates `.ketchup/` with default configuration. Then verify:

```
/ketchup:config show
```

Ketchup is now active with commit validation, reminders, and deny-lists.

---

## Step 3: Explore What Was Created

```bash
ls -la .claude/ .ketchup/
```

See the [Architecture Guide](/architecture#directory-structure) for complete directory structure details.

---

## Step 4: Feed the System

Create your first reminder to inject YOUR rules into every session:

```bash
cat > .ketchup/reminders/my-project.md << 'EOF'
---
when:
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

See the [Hooks Guide](/hooks-guide#protect-files-with-deny-list) for file protection setup.

---

## Step 6: Watch the System Work

Start a Claude Code session. The supervisor will:

1. **Inject** your guidelines at session start
2. **Validate** every commit against your rules
3. **ACK** clean commits, **NACK** rule violations

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

You installed Ketchup:

| Component     | What It Does                            | You Just Enabled       |
| ------------- | --------------------------------------- | ---------------------- |
| Validators    | ACK/NACK every commit via LLM           | PreToolUse hooks       |
| Reminders     | Your rules, every session + prompt      | SessionStart + prompt  |
| Deny-list     | Structural file protection              | PreToolUse deny-list   |
| TCR gate      | `test && commit revert` enforced        | TCR Workflow validator |

---

## The Transformation

See the [transformation story](/origin-story#the-transformation) for the complete journey.

---

## Next Steps

- [Guardrail Engineering](/guardrail-engineering) - The mechanism behind Ketchup
- [The Ketchup Technique](/ketchup-technique) - The planning rhythm
- [Configuration Reference](/configuration) - All configuration options
- [Hooks Guide](/hooks-guide) - Hook system deep-dive
- [Origin Story](/origin-story) - The path from babysitter to guardrail engineer

---

## Troubleshooting

Having issues? See the [Configuration Guide](/configuration#troubleshooting) for common problems and solutions, or run:

```
/ketchup:config show
```
