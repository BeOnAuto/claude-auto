# claude-ketchup

Husky-style hooks and skills management for Claude Code, implementing the Ketchup Technique.*

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)]()

---

## The Ketchup Technique

Just like with real ketchup, you don't dump the whole bottle on your plate—you dispense it in controlled bursts.

The Ketchup Technique is an AI-native development methodology that harnesses Claude's enthusiasm through:

- **Controlled Bursts**: One test, one behavior, one commit
- **TCR Discipline**: Test && Commit || Revert—never patch failing code
- **Emergent Design**: Let architecture emerge from passing tests
- **100% Coverage**: True TDD yields complete coverage naturally
- **Fresh Nomenclature**: "Bottles" and "Bursts" avoid LLM training pollution

```
BURST → COMMIT → BURST → COMMIT
```

The technique grew from frustration with AI over-execution—asking for "Hello World" and getting a nav bar, login system, and comment section. By enforcing small, reversible increments, the Ketchup Technique channels AI energy productively.

**[Read the full origin story →](KETCHUP-STORY.md)**

---

## Purpose

Without claude-ketchup, you would have to manually create and maintain `.claude/` directories, copy hook scripts between projects, configure `settings.json` by hand, and track which skills are active across different codebases.

claude-ketchup automates Claude Code project setup through npm lifecycle hooks. Install it once, and your project gets automatic hook management, skills injection, file protection via deny-lists, and settings merging with project/local overrides.

---

## Installation

```bash
npm install claude-ketchup
```

Or with pnpm:

```bash
pnpm add claude-ketchup
```

## Quick Start

```bash
# 1. Install the package
pnpm add claude-ketchup

# 2. Verify installation
claude-ketchup status

# 3. Check symlink health
claude-ketchup doctor
```

After installation, claude-ketchup automatically:
- Creates a `.claude/` directory in your project root
- Symlinks hook scripts, skills, and commands from the package
- Generates a `.gitignore` for symlinked and runtime files
- Merges default settings into your Claude configuration

---

## How-to Guides

### Create a Custom Skill

Skills are markdown files with YAML frontmatter that inject context into Claude sessions.

```bash
# Create a skill that runs at session start
cat > .claude/skills/my-project.md << 'EOF'
---
hook: SessionStart
priority: 50
---

# Project Guidelines

- Follow TDD principles
- Use TypeScript strict mode
- Write tests before implementation
EOF
```

### Protect Files with Deny-List

Prevent Claude from modifying sensitive files:

```bash
# Create a project deny-list
cat > .claude/deny-list.project.txt << 'EOF'
# Secrets
.env
*.secret
credentials.json

# Generated files
dist/**
node_modules/**
EOF
```

### Override Package Settings

Create project-specific settings:

```bash
# .claude/settings.project.json
{
  "hooks": {
    "PreToolUse": {
      "_disabled": ["some-command-to-disable"]
    }
  }
}
```

Or local-only settings (gitignored):

```bash
# .claude/settings.local.json
{
  "hooks": {
    "SessionStart": {
      "_mode": "replace",
      "_value": []
    }
  }
}
```

---

## CLI Reference

### Commands

#### `claude-ketchup status`

Show symlink status for all expected hook scripts and skills.

```bash
claude-ketchup status
```

#### `claude-ketchup doctor`

Diagnose symlink health by verifying all symlinks point to valid targets.

```bash
claude-ketchup doctor
```

#### `claude-ketchup repair`

Recreate broken or missing symlinks in the `.claude/` directory.

```bash
claude-ketchup repair
```

#### `claude-ketchup skills`

List all skills with their metadata.

```bash
claude-ketchup skills
```

---

## Hooks System

claude-ketchup provides three hooks that integrate with Claude Code:

### SessionStart

Fires when a Claude Code session begins. Use it to inject project context, guidelines, or documentation.

**Input:** Claude directory path
**Output:** Concatenated content of matching skills

### PreToolUse

Fires before Claude uses a tool (Edit, Write, NotebookEdit). Use it to protect sensitive files.

**Input:** Tool name and input parameters
**Output:** `{ decision: "allow" | "block", reason?: string }`

### UserPromptSubmit

Fires when user submits a prompt. Use it to inject reminders or context.

**Input:** User prompt text
**Output:** Original prompt with `<system-reminder>` tags appended

---

## Skills System

Skills are markdown files in `.claude/skills/` with YAML frontmatter:

```markdown
---
hook: SessionStart
priority: 100
mode: code
when:
  projectType: typescript
---

# Skill Content

Instructions for Claude...
```

### Frontmatter Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `hook` | string | Yes | - | Which hook triggers this skill |
| `priority` | number | No | 0 | Execution order (higher runs first) |
| `mode` | string | No | - | Filter by mode (plan/code) |
| `when` | object | No | - | Conditional activation based on state |

---

## Settings Merger

Settings are merged in priority order:

1. `templates/settings.json` (package defaults)
2. `.claude/settings.project.json` (project overrides, checked in)
3. `.claude/settings.local.json` (local overrides, gitignored)

### Override Modes

**Replace entire hook:**

```json
{
  "hooks": {
    "SessionStart": {
      "_mode": "replace",
      "_value": [{ "hooks": [{ "type": "command", "command": "my-cmd" }] }]
    }
  }
}
```

**Disable specific commands:**

```json
{
  "hooks": {
    "SessionStart": {
      "_disabled": ["command-to-remove"]
    }
  }
}
```

---

## Troubleshooting

### Symlinks Not Created

**Symptom:** `.claude/` directory is empty after install

**Cause:** Project root detection failed or permission issues

**Solution:**

```bash
# Set explicit project root
KETCHUP_ROOT=/path/to/project pnpm add claude-ketchup

# Or repair manually
claude-ketchup repair
```

### Hooks Not Firing

**Symptom:** Skills don't load at session start

**Cause:** settings.json not merged correctly

**Solution:**

```bash
# Check symlink health
claude-ketchup doctor

# Repair if needed
claude-ketchup repair

# Verify settings
cat .claude/settings.json
```

### Enable Debug Logging

```bash
DEBUG=ketchup* claude-ketchup status
```

---

## Architecture

```
your-project/
├── .claude/
│   ├── scripts/           # Symlinked hook scripts
│   │   ├── session-start.ts
│   │   ├── pre-tool-use.ts
│   │   └── user-prompt-submit.ts
│   ├── skills/            # Symlinked + custom skills
│   │   └── ketchup.enforced.md
│   ├── commands/          # Symlinked commands
│   │   └── ketchup.md
│   ├── settings.json      # Merged settings (generated)
│   ├── settings.project.json  # Project overrides (optional)
│   ├── settings.local.json    # Local overrides (optional)
│   ├── deny-list.project.txt  # Project deny patterns
│   ├── deny-list.local.txt    # Local deny patterns
│   └── .gitignore         # Generated
└── node_modules/
    └── claude-ketchup/
        ├── scripts/       # Source scripts
        ├── skills/        # Source skills
        ├── commands/      # Source commands
        └── templates/     # Default settings
```

### Dependencies

| Package | Usage |
|---------|-------|
| commander | CLI argument parsing |
| micromatch | Glob pattern matching for deny-list |
| yaml | YAML parsing for skill frontmatter |

---

## API Reference

For programmatic usage:

```typescript
import {
  findProjectRoot,
  createSymlink,
  removeSymlink,
  verifySymlink,
  generateGitignore,
  mergeSettings,
  readState,
  writeState,
  scanSkills,
  parseSkill,
  filterByHook,
  filterByMode,
  filterByState,
  sortByPriority,
  loadDenyPatterns,
  isDenied,
  getStatus,
  repair,
  doctor,
  listSkills,
  createCli,
} from 'claude-ketchup';
```

---

## Development

```bash
# Clone the repository
git clone https://github.com/samhatoum/claude-ketchup.git
cd claude-ketchup

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Build
pnpm build
```

### Testing Locally

```bash
# In claude-ketchup directory
pnpm link --global

# In your test project
pnpm link --global claude-ketchup
```

Or test postinstall directly:

```bash
KETCHUP_ROOT=/path/to/test-project npx tsx bin/postinstall.ts
```

---

## License

MIT © 2025 Sam Hatoum

See [LICENSE](LICENSE) for details.

---

<sub>*The Ketchup Technique is an independent methodology for AI-native development. While it acknowledges the foundation of time-boxed intervals found in the Pomodoro® Technique (a registered trademark of Francesco Cirillo), it is a separate method. Learn more at [pomodorotechnique.com](http://pomodorotechnique.com/).</sub>
