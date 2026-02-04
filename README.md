# Claude Auto

**Put Claude on Auto.**

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)]()

---

## The Problem: You're an AI Babysitter

AI-assisted coding captured your cognitive load.

Every session demands your full attention. Watching, nudging, correcting. You can't shift focus because you don't trust the system.

- You can't context-switch while supervising
- One task at a time, full attention required
- The bottleneck is your attention, not AI's speed

That's not multiplication. That's marginally faster serial work.

---

## The Solution: The Quality Loop

Claude Auto earns trust. Trust enables parallelization.

| Component          | What It Does                                 | Result                          |
| ------------------ | -------------------------------------------- | ------------------------------- |
| **Auto-Planner**   | Generates plan from your requirements        | No need to specify every detail |
| **Supervisor AI**  | Validates every commit against your criteria | Automated review                |
| **TCR Discipline** | Test && Commit \|\| Revert                   | Bad code auto-reverts           |
| **Auto-Continue**  | Keeps going until the plan is done           | You check back, not babysit     |

The system is trustworthy. That's what lets you direct instead of babysit.

---

## The Multiplier: Git Worktrees

Git worktrees let you run multiple isolated workspaces from the same repo.

```bash
# Create worktrees for parallel features
git worktree add ../feature-auth feature/auth
git worktree add ../feature-payments feature/payments
git worktree add ../feature-dashboard feature/dashboard
```

Each runs a Claude Auto instance. All quality-validated.

| Approach                      | Features/Week |
| ----------------------------- | ------------- |
| Manual coding                 | 1             |
| AI-assisted (babysitting)     | 1-2           |
| **Claude Auto + Worktrees**   | **10+**       |

---

## Three Steps

### 1. Install

```bash
npx claude-auto install
```

Feed your requirements. Claude Auto auto-generates the plan with Bottles, Bursts, and Dependencies.

### 2. Release

Start execution and shift your focus. The Supervisor validates every commit. Auto-continue keeps it going. Check back to review outcomes.

### 3. Multiply

Open another worktree. Start another instance. Run 3-5 features in parallel. Ship 10+ per week.

---

## The Transformation

| Before (Babysitter)              | After (Bionic)                 |
| -------------------------------- | ------------------------------ |
| Watching one AI session          | Directing multiple workstreams |
| Nudging, correcting in real-time | Defining, approving, releasing |
| Serial productivity              | Parallel productivity          |
| Marginal gains (1.5x)            | Multiplicative gains (10x+)    |
| Brain captured by supervision    | Brain freed for the next thing |

From Babysitter to Bionic.

---

## Installation

```bash
# Install Claude Auto
npx claude-auto install

# Verify installation
npx claude-auto doctor

# You're ready to become Bionic
```

After installation, claude-auto automatically:

- Injects hooks that validate every commit
- Creates reminders that inject your guidelines
- Sets up file protection via deny-lists
- Merges settings with smart project/local overrides

---

## Authority: Battle-Tested

Built on foundations from Kent Beck's TCR and Extreme Programming principles. Refined through production features at Auto.

The on.auto team ships 10+ features per week. Not 1-2.

**[Read the origin story →](./docs/origin-story.md)**

---

## CLI Reference

| Command                    | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `claude-auto install`     | Install and configure claude-auto in your project   |
| `claude-auto init`        | Initialize configuration                            |
| `claude-auto status`      | Show symlink status for hook scripts and reminders  |
| `claude-auto doctor`      | Diagnose installation health                        |
| `claude-auto repair`      | Recreate broken or missing symlinks                 |
| `claude-auto reminders`   | List active reminders with metadata                 |
| `claude-auto clean-logs`  | Remove old log files (use `--older-than=N` to keep N recent logs) |

---

## Documentation

| Guide                                            | Description                     |
| ------------------------------------------------ | ------------------------------- |
| [Getting Started](./docs/getting-started.md)     | 5-minute transformation         |
| [Installation](./docs/installation.md)           | Detailed installation guide     |
| [The Ketchup Technique](./docs/ketchup-technique.md) | The planning methodology |
| [Configuration](./docs/configuration.md)         | All configuration options       |
| [Hooks Guide](./docs/hooks-guide.md)             | Configure your supervision      |
| [Reminders Guide](./docs/reminders-guide.md)     | Context injection system        |
| [Validators Guide](./docs/validators-guide.md)   | Commit validation rules         |
| [API Reference](./docs/api-reference.md)         | Programmatic access             |
| [Architecture](./docs/architecture.md)           | System design internals         |

---

## Development

```bash
git clone https://github.com/BeOnAuto/claude-auto.git
cd claude-auto
pnpm install
pnpm test
pnpm build
```

---

## License

MIT © 2025 BeOnAuto, Inc.

See [LICENSE](LICENSE) for details.

---
