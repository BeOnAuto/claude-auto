# Claude Ketchup

**Stop Babysitting. Start Parallelizing.**

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)]()

---

## The Problem: You're an AI Babysitter

AI-assisted coding captured your cognitive load.

Every session demands your full attention. Watching, nudging, correcting. You can't walk away because you don't trust the system.

- You can't context-switch while supervising
- One task at a time, full attention required
- The bottleneck is your attention, not AI's speed

That's not multiplication. That's marginally faster serial work.

---

## The Solution: The Quality Stack

Claude Ketchup creates trust. Trust enables parallelization.

| Component          | What It Does                                 | Result                          |
| ------------------ | -------------------------------------------- | ------------------------------- |
| **Auto-Planner**   | Generates plan from your requirements        | No need to specify every detail |
| **Supervisor AI**  | Validates every commit against your criteria | Automated review                |
| **TCR Discipline** | Test && Commit \|\| Revert                   | Bad code auto-reverts           |
| **Auto-Continue**  | Keeps going until the plan is done           | No nudging required             |

The system is trustworthy. That's what frees you.

---

## The Multiplier: Git Worktrees

Git worktrees let you run multiple isolated workspaces from the same repo.

```bash
# Create worktrees for parallel features
git worktree add ../feature-auth feature/auth
git worktree add ../feature-payments feature/payments
git worktree add ../feature-dashboard feature/dashboard
```

Each runs a Ketchup instance. All quality-validated.

| Approach                  | Features/Week |
| ------------------------- | ------------- |
| Manual coding             | 1             |
| AI-assisted (babysitting) | 1-2           |
| **Ketchup + Worktrees**   | **5-10**      |

---

## Three Steps

### 1. Install

```bash
npx claude-ketchup install
```

Feed your requirements. Ketchup auto-generates the plan with Bottles, Bursts, and Dependencies.

### 2. Release

Start execution and walk away. The Supervisor validates every commit. Auto-continue keeps it going until done.

### 3. Multiply

Open another worktree. Start another instance. Three features. Five features. All in parallel.

---

## The Transformation

| Before (Babysitter)              | After (Bionic)                 |
| -------------------------------- | ------------------------------ |
| Watching one AI session          | Directing multiple workstreams |
| Nudging, correcting in real-time | Defining, approving, releasing |
| Serial productivity              | Parallel productivity          |
| Marginal gains (1.5x)            | Multiplicative gains (5-10x)   |
| Brain captured by supervision    | Brain freed for the next thing |

From Babysitter to Bionic.

---

## Installation

```bash
# Install Claude Ketchup
npx claude-ketchup install

# Verify installation
npx claude-ketchup doctor

# You're ready to become Bionic
```

After installation, claude-ketchup automatically:

- Injects hooks that validate every commit
- Creates reminders that inject your guidelines
- Sets up file protection via deny-lists
- Merges settings with smart project/local overrides

---

## Authority: Battle-Tested

Built on foundations from Kent Beck's TCR and Extreme Programming principles. Refined through production features at Auto.

The on.auto team ships 5-10 features per week. Not 1-2.

**[Read the origin story →](./docs/origin-story.md)**

---

## CLI Reference

| Command                    | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `claude-ketchup install`  | Install and configure claude-ketchup in your project |
| `claude-ketchup init`     | Initialize ketchup configuration                    |
| `claude-ketchup status`   | Show symlink status for hook scripts and reminders  |
| `claude-ketchup doctor`   | Diagnose installation health                        |
| `claude-ketchup repair`   | Recreate broken or missing symlinks                 |
| `claude-ketchup reminders`| List active reminders with metadata                 |
| `claude-ketchup clean-logs`| Remove old log files (use `--older-than=N` to keep N recent logs) |

---

## Documentation

| Guide                                            | Description                     |
| ------------------------------------------------ | ------------------------------- |
| [Getting Started](./docs/getting-started.md)     | 5-minute transformation         |
| [Installation](./docs/installation.md)           | Detailed installation guide     |
| [The Quality Stack](./docs/ketchup-technique.md) | Why you can walk away           |
| [Configuration](./docs/configuration.md)         | All configuration options       |
| [Hooks Guide](./docs/hooks-guide.md)             | Configure your supervision      |
| [Reminders Guide](./docs/reminders-guide.md)     | Context injection system        |
| [Validators Guide](./docs/validators-guide.md)   | Commit validation rules         |
| [API Reference](./docs/api-reference.md)         | Programmatic access             |
| [Architecture](./docs/architecture.md)           | System design internals         |

---

## Development

```bash
git clone https://github.com/xolvio/claude-ketchup.git
cd claude-ketchup
pnpm install
pnpm test
pnpm build
```

---

## License

MIT © 2025 Xolvio, Inc.

See [LICENSE](LICENSE) for details.

---
