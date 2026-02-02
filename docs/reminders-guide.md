# Reminders Guide

Complete guide to using reminders to inject context and guidelines into Claude sessions.

---

## What Are Reminders?

Reminders are Markdown files that inject context, guidelines, and rules into Claude sessions at specific hook points. They replace the previous "skills" system with a more flexible and powerful approach.

Think of reminders as:
- **Context injectors** that ensure Claude always has your project rules
- **Behavioral guides** that shape how Claude approaches tasks
- **Quality enforcers** that maintain standards across all sessions

---

## How Reminders Work

```
User starts Claude session
         │
         ▼
┌─────────────────────────┐
│  SessionStart hook fires│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Load reminders from:   │
│  - .ketchup/reminders/  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Filter by:             │
│  - Hook type            │
│  - Mode (plan/code)     │
│  - State conditions     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Sort by priority       │
│  Inject into session    │
└─────────────────────────┘
```

---

## Creating Your First Reminder

### Basic Reminder

Create `.ketchup/reminders/my-project.md`:

```markdown
---
when:
  hook: SessionStart
priority: 50
---

# My Project Guidelines

- Always use TypeScript strict mode
- Follow TDD: test first, code second
- One test, one behavior, one commit
- No comments in code - write self-documenting code
```

This reminder will be injected at the start of every Claude session.

---

## Reminder Frontmatter

Every reminder starts with YAML frontmatter that controls when and how it's loaded:

### Required Fields

```yaml
---
when:
  hook: SessionStart  # or UserPromptSubmit
---
```

### All Options

```yaml
---
when:
  hook: SessionStart        # When to trigger (required)
  mode: code               # Optional: 'plan' or 'code'
  projectType: typescript  # Optional: state condition
  framework: express       # Optional: another condition
priority: 100              # Optional: execution order (higher = earlier)
---
```

---

## Which Hook to Use

Reminders can be triggered by different hooks. See the [Hooks Guide](/hooks-guide#understanding-each-hook) for detailed information about when each hook fires.

**Quick reference:**
- **SessionStart**: Use for project guidelines, architecture decisions, and team conventions that should be loaded once at session start
- **UserPromptSubmit**: Use for dynamic reminders that should be injected with each user prompt

---

## Priority System

Reminders are sorted by priority (highest first):

| Priority | Use Case |
|----------|----------|
| 100+ | Critical rules that must come first |
| 50-99 | Project-specific guidelines |
| 10-49 | Team conventions |
| 0-9 | Nice-to-have suggestions |
| <0 | Low priority, processed last |

Example priority ordering:

```yaml
# Loads first
---
when:
  hook: SessionStart
priority: 150
---

# CRITICAL: Security Requirements
...

# Loads second
---
when:
  hook: SessionStart
priority: 100
---

# Architecture Guidelines
...

# Loads last
---
when:
  hook: SessionStart
priority: 10
---

# Coding Style Preferences
...
```

---

## Conditional Loading

### Mode Filtering

Load reminders only in specific modes:

```yaml
---
when:
  hook: SessionStart
  mode: plan  # Only loads in planning mode
priority: 100
---

# Planning Guidelines

When creating plans:
- Break features into bottles and bursts
- Identify dependencies explicitly
- Keep bursts atomic and testable
```

```yaml
---
when:
  hook: SessionStart
  mode: code  # Only loads in coding mode
priority: 100
---

# Coding Standards

When implementing:
- Write test first (TDD)
- Implement minimal code to pass
- Refactor only after green
```

### State-Based Conditions

Load reminders based on project state:

1. First, define your state in `.claude/state.json`:

```json
{
  "projectType": "typescript",
  "framework": "express",
  "database": "postgres",
  "testFramework": "vitest"
}
```

2. Then create conditional reminders:

```yaml
---
when:
  hook: SessionStart
  projectType: typescript
  framework: express
priority: 75
---

# Express + TypeScript Guidelines

- Use strong typing for request/response
- Implement proper error middleware
- Type all route parameters
```

All conditions must match (AND logic) for the reminder to load.

---

## Built-in Reminders

Claude Ketchup comes with several built-in reminders:

### Core Methodology

- **ketchup.md** - The complete Ketchup/TCR methodology
- **extreme-ownership.md** - Take ownership of all code you touch
- **emergent-design.md** - Let types emerge from tests
- **test-title-spec.md** - Test titles must match assertions

### Workflow

- **parallelization.md** - How to run bursts in parallel
- **sub-agent-rules.md** - Rules for spawning sub-agents
- **rethink-after-revert.md** - What to do after TCR revert
- **ide-diagnostics.md** - Check IDE before committing

### Documentation

- **documentation.md** - When and how to update docs

These are symlinked from the package and always available.

---

## Custom Reminders

### Project-Specific

Create reminders for your project's unique needs:

```markdown
---
when:
  hook: SessionStart
priority: 60
---

# Our API Conventions

- All endpoints return `{ data, error }` format
- Use POST for all mutations
- Include request ID in headers
- Rate limit all public endpoints
```

### Team Standards

Share team conventions:

```markdown
---
when:
  hook: SessionStart
priority: 40
---

# Team Code Review Standards

Before requesting review:
- All tests pass
- Coverage > 90%
- No console.logs
- Types exported from index
```

### Feature-Specific

Add temporary reminders for current work:

```markdown
---
when:
  hook: UserPromptSubmit
priority: 80
---

# Payment Integration Notes

Currently working on Stripe integration:
- Use Payment Intents API
- Store customer ID, not card details
- All amounts in cents
- Test with webhook CLI locally
```

---

## Best Practices

### 1. Keep Reminders Focused

Each reminder should have a single purpose:

**Good:**
```markdown
# Testing Standards

- Every feature needs a test
- Test behavior, not implementation
- Use clear test descriptions
```

**Too Broad:**
```markdown
# Everything About Our Project

- Testing standards...
- Architecture decisions...
- Deployment process...
- Team contacts...
```

### 2. Use Clear Priorities

Reserve high priorities (100+) for critical rules:
- Security requirements
- Legal compliance
- Breaking changes to avoid

### 3. Leverage Conditions

Don't load everything always. Use conditions:
- Mode-specific (plan vs code)
- Project-type specific
- Feature-specific

### 4. Regular Cleanup

Remove outdated reminders:
- Feature-specific reminders after completion
- Sprint-specific guidelines after sprint
- Temporary workarounds after fixes

### 5. Version Control

Commit project reminders (not personal preferences):

```bash
# Project reminders (commit these)
.ketchup/reminders/architecture.md
.ketchup/reminders/testing.md

# Personal reminders (gitignore these)
.ketchup/reminders/my-shortcuts.local.md
```

---

## Debugging Reminders

### Check What's Loaded

See which reminders are active:

```bash
npx claude-ketchup reminders
```

### Test Reminder Loading

Manually test a reminder:

```bash
npx tsx -e "
import { parseReminder } from 'claude-ketchup';
import { readFileSync } from 'fs';

const content = readFileSync('.ketchup/reminders/my-reminder.md', 'utf-8');
const parsed = parseReminder(content, 'my-reminder.md');
console.log(JSON.stringify(parsed, null, 2));
"
```

### View Session Logs

Check what was injected:

```bash
tail -f .ketchup/logs/activity.log
```

---

## Examples

### TDD Enforcement

```markdown
---
when:
  hook: SessionStart
  mode: code
priority: 120
---

# TDD is Mandatory

NEVER write code without a failing test first.

The cycle is:
1. Write failing test (RED)
2. Write minimal code to pass (GREEN)
3. Commit immediately (TCR)
4. Refactor if needed
5. Commit again

If you're not sure what to test, ask for clarification.
```

### Architecture Guard

```markdown
---
when:
  hook: SessionStart
priority: 110
---

# Clean Architecture Rules

Dependencies flow inward:
- Domain knows nothing about outer layers
- Application depends on Domain only
- Infrastructure depends on Application
- Presentation depends on all

Violations to watch for:
- Domain importing from infrastructure
- Business logic in controllers
- Database queries in use cases
```

### Sprint Focus

```markdown
---
when:
  hook: UserPromptSubmit
priority: 90
---

# Sprint 23 Focus

This sprint prioritize:
1. Mobile responsiveness bugs
2. Performance on list views
3. Accessibility improvements

Defer:
- New features
- Nice-to-have refactors
- Documentation updates
```

---

## Migration from Skills

If you're migrating from the old skills system:

### Old Format (skills):
```yaml
---
hook: SessionStart
priority: 50
mode: code
---
```

### New Format (reminders):
```yaml
---
when:
  hook: SessionStart
  mode: code
priority: 50
---
```

Key changes:
1. Most fields move under `when:`
2. Directory changes from `.claude/skills/` to `.ketchup/reminders/`
3. Function names in API change from `*Skill*` to `*Reminder*`

---

## Troubleshooting

### Reminder Not Loading

Check:
1. Frontmatter is valid YAML
2. Required `when.hook` field exists
3. Conditions match current state
4. Priority isn't negative (loads last)

### Syntax Errors

Common issues:
- Missing `---` delimiters
- Incorrect indentation in YAML
- Typo in hook name

### Conflicts

If reminders conflict:
- Higher priority wins
- Be explicit about precedence
- Use state conditions to separate contexts

---

## Next Steps

- [Create your first reminder](#creating-your-first-reminder)
- [View built-in reminders](https://github.com/BeOnAuto/claude-ketchup/tree/main/reminders)
- [Configure validators](/validators-guide)
- [Manage hook state](./configuration.md#hook-state)