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

```bash
npx claude-ketchup install
```

This single command sets up everything you need - no package installation or configuration required.

Behind the scenes, claude-ketchup:

- Copies hook scripts to `.ketchup/scripts/`
- Creates reminders that inject your guidelines
- Sets up the supervisor that ACKs or NACKs changes
- Initializes hook state with sensible defaults

---

## Step 2: Verify Your Transformation

```bash
npx claude-ketchup doctor
```

All green? The Quality Stack is active. You can now walk away.

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
4. **Auto-continue** until the plan is complete

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
| Context Injection | Your rules, every session     | SessionStart reminders  |
| File Protection   | Deny-list for sensitive files | PreToolUse deny-list    |
| Auto-Continue     | AI works until plan complete  | Stop hooks              |

---

## The Transformation

See the [transformation story](/origin-story#the-transformation) for the complete journey.

---

## Next Steps

- [Configuration Reference](/configuration) - All configuration options
- [The Quality Stack](/ketchup-technique) - Why you can walk away
- [Hooks Guide](/hooks-guide) - Configure your supervision
- [Origin Story](/origin-story) - The journey from babysitter to bionic

---

## Troubleshooting

Having issues? See the [Configuration Guide](/configuration#troubleshooting) for common problems and solutions, or run:

```bash
npx claude-ketchup doctor
```
