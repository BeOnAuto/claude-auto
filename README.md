# Claude Ketchup

**From AI Janitor to System Architect**

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)]()

---

## The Problem: You're the AI Janitor

Ask Claude for "Hello World" and you get a nav bar, login system, and comment section.

AI doesn't get tired. It over-executes. And you're left cleaning up the mess.

Without discipline:

- Features nobody asked for
- Defensive code paths that never run
- Enterprise architecture for throwaway scripts
- Hours spent reviewing, reverting, and redoing

**You wanted an AI partner. You got a mess-making machine.**

---

## The Solution: The Quality Stack

Claude Ketchup transforms your role. Stop cleaning up. Start directing.

| Component                 | What It Does                                            |
| ------------------------- | ------------------------------------------------------- |
| **Auto-Planning**         | AI plans in `ketchup-plan.md` before writing code       |
| **Parallel Execution**    | Sub-agents work on independent bursts simultaneously    |
| **Supervisor Validation** | Every commit is ACK'd or NACK'd by the validator        |
| **Auto-Continue**         | AI keeps working until the plan is complete             |
| **TCR Discipline**        | Test && Commit \|\| Revert. Tests pass or code reverts. |

**Speed. Quality. Control. All three.**

---

## The Plan: Feed, Approve, Watch

### 1. Feed

Define requirements in `ketchup-plan.md`. Bottles (features) contain Bursts (atomic changes).

### 2. Approve

The supervisor validates every commit against your rules. ACK proceeds. NACK reverts.

### 3. Watch

Architecture emerges from passing tests. You review results, not repairs.

---

## Quick Start

```bash
# Install
pnpm add -D claude-ketchup

# Verify
claude-ketchup doctor

# You're now the architect
```

After installation, claude-ketchup automatically:

- Injects hooks that validate every commit
- Creates skills that inject your guidelines
- Sets up file protection via deny-lists
- Merges settings with smart project/local overrides

---

## The Stakes

### Without Claude Ketchup

- Endless code review cycles
- "Let me just fix this one thing" spirals
- Coverage gaps and untested paths
- AI that fights your architecture

### With Claude Ketchup

- Predictable, reviewable increments
- 100% coverage by construction
- Clean git history (one behavior per commit)
- AI that follows your system

---

## Authority: Battle-Tested

Built on foundations from Kent Beck's TCR and Extreme Programming principles. Refined through production features at Auto. Used daily by the creator on real codebases.

The technique evolved from constant refinement: notice where Claude misbehaves, automate a fix, repeat. Each problem became a feature.

**[Read the origin story →](./docs/origin-story.md)**

---

## CLI Reference

| Command                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `claude-ketchup status` | Show symlink status for hook scripts and skills |
| `claude-ketchup doctor` | Diagnose symlink health                         |
| `claude-ketchup repair` | Recreate broken or missing symlinks             |
| `claude-ketchup skills` | List all skills with metadata                   |

---

## Documentation

| Guide                                            | Description                |
| ------------------------------------------------ | -------------------------- |
| [Getting Started](./docs/getting-started.md)     | 5-minute setup tutorial    |
| [The Quality Stack](./docs/ketchup-technique.md) | The methodology explained  |
| [Hooks Guide](./docs/hooks-guide.md)             | Practical how-to guides    |
| [API Reference](./docs/api-reference.md)         | Complete API documentation |
| [Architecture](./docs/architecture.md)           | System design internals    |

---

## Development

```bash
git clone https://github.com/BeOnAuto/claude-ketchup.git
cd claude-ketchup
pnpm install
pnpm test
pnpm build
```

---

## License

MIT © 2025 BeOnAuto, Inc.

See [LICENSE](LICENSE) for details.

---
