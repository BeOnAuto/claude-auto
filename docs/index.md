---
layout: home

hero:
  name: Claude Ketchup
  text: From AI Janitor to System Architect
  tagline: Stop cleaning up after AI. Start directing it.
  image:
    src: /hero.png
    alt: Claude Ketchup - The Quality Stack
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: The Quality Stack
      link: /ketchup-technique
    - theme: alt
      text: View on GitHub
      link: https://github.com/BeOnAuto/claude-ketchup

features:
  - icon:
      src: /icon-janitor.png
    title: "The Problem: AI Janitor"
    details: Ask for Hello World, get 10,000 lines of code. You spend more time cleaning up than building.
  - icon:
      src: /icon-architect.png
    title: "The Solution: System Architect"
    details: Define requirements. Let the system execute. Review results, not repairs.
  - icon:
      src: /icon-tcr.png
    title: TCR Discipline
    details: "Every change earns its place or disappears through <code>test && commit || revert</code>"
  - icon:
      src: /icon-supervisor.png
    title: Supervisor Validation
    details: ACK or NACK. Every commit is validated against your rules before it lands.
  - icon:
      src: /icon-parallel.png
    title: Parallel Execution
    details: Independent bursts run simultaneously. Speed without sacrificing quality.
  - icon:
      src: /icon-coverage.png
    title: 100% Coverage by Construction
    details: No untested code. As per TDD, it exists only if a test demanded it.
---

## The Quality Stack

Speed, Quality, AND Control. The Ketchup Technique delivers all three through:

| Component                 | What It Does                                           |
| ------------------------- | ------------------------------------------------------ |
| **Auto-Planning**         | AI plans in `ketchup-plan.md` before writing code      |
| **Parallel Execution**    | Sub-agents work on independent bursts simultaneously   |
| **Supervisor Validation** | Every commit is ACK'd or NACK'd by the validator       |
| **Auto-Continue**         | AI keeps working until the plan is complete            |
| **TCR Discipline**        | Tests pass → commit. Tests fail → revert. No patching. |

## Three Steps to Architect Mode

### 1. Feed

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

Install once. The hooks inject automatically.

### 2. Approve

Define your requirements. The supervisor enforces them.

### 3. Watch

Architecture emerges from passing tests. You review clean increments.

**[Start your transformation →](/getting-started)**
