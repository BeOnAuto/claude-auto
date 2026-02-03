# Installation Guide

Complete guide for installing and configuring Claude Auto in your project.

---

## Quick Install

```bash
npx claude-auto install
```

That's it! This single command sets up everything you need.

---

## What Gets Installed

When you run `npx claude-auto install`:

1. Creates `.claude/` and `.claude-auto/` directories
2. Copies hook scripts to `.claude-auto/scripts/`
3. Creates `settings.json` from package template
4. Copies built-in reminders and validators
5. Initializes hook state at `.claude-auto/.claude.hooks.json`

See the [Architecture Guide](/architecture#directory-structure) for complete directory structure details.

See the [Reminders Guide](/reminders-guide) and [Validators Guide](/validators-guide) for the complete list of built-in reminders and validators.

---

## Verify Installation

After installation, verify everything is set up correctly:

```bash
npx claude-auto doctor
```

You should see green checkmarks for all components:

```
✓ Project root found
✓ .claude directory exists
✓ .claude-auto directory exists
✓ All symlinks valid
✓ Settings merged successfully
✓ Hook scripts executable
```

---

## Manual Installation

If you prefer to install manually or need custom control:

### Step 1: Clone the structure

```bash
# Create directories
mkdir -p .claude/commands
mkdir -p .claude-auto/scripts .claude-auto/reminders .claude-auto/validators

# Create initial hook state
cat > .claude-auto/.claude.hooks.json << 'EOF'
{
  "autoContinue": {
    "mode": "smart",
    "maxIterations": 0
  },
  "validateCommit": {
    "mode": "strict"
  },
  "denyList": {
    "enabled": true
  }
}
EOF
```

### Step 2: Set up hooks

Create `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "node .claude-auto/scripts/session-start.js" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|NotebookEdit|Bash",
        "hooks": [
          { "type": "command", "command": "node .claude-auto/scripts/pre-tool-use.js" }
        ]
      }
    ]
  }
}
```

### Step 3: Add custom reminders

Create `.claude-auto/reminders/my-project.md`:

```markdown
---
when:
  hook: SessionStart
priority: 100
---

# My Project Guidelines

Your project-specific rules here...
```

---

## Troubleshooting

### Command not found

If `npx claude-auto` doesn't work:

```bash
# Install globally
npm install -g claude-auto

# Then run
claude-auto install
```

### Permission denied

On Unix systems, you might need to fix permissions:

```bash
chmod +x .claude-auto/scripts/*.js
```

### Scripts not created

If scripts are missing:

```bash
# Run repair command
npx claude-auto repair

# Or re-run install
npx claude-auto install
```

### Hooks not firing

Verify Claude Code can find your settings:

1. Check `.claude/settings.json` exists
2. Ensure you're in the project root when starting Claude
3. Check logs in `.claude-auto/logs/` for errors

---

## Uninstall

To remove Claude Auto from your project:

```bash
# Remove directories
rm -rf .claude .claude-auto

# Remove from package.json if installed
npm uninstall claude-auto
```

---

## Environment Variables

Control installation behavior with these environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `AUTO_ROOT` | Force project root path | Auto-detected |
| `AUTO_SKIP_POSTINSTALL` | Skip automatic setup | `false` |
| `DEBUG` | Enable debug logging | - |

Example:

```bash
# Install with debug logging
DEBUG=claude-auto* npx claude-auto install

# Install in specific directory
AUTO_ROOT=/path/to/project npx claude-auto install
```

---

## CI/CD Integration

### Skip installation in CI

Set environment variable to skip postinstall:

```yaml
# GitHub Actions
env:
  AUTO_SKIP_POSTINSTALL: true
```

### Docker

Add to Dockerfile:

```dockerfile
# Install without postinstall
ENV AUTO_SKIP_POSTINSTALL=true
RUN npm install

# Manually run install when needed
RUN npx claude-auto install
```

---

## Next Steps

After installation:

1. [Configure your hooks](/hooks-guide) - Customize supervision rules
2. [Add reminders](/configuration#reminder-frontmatter) - Inject your guidelines
3. [Set up file protection](/hooks-guide#protect-files-with-deny-list) - Protect sensitive files
4. [Enable auto-continue](/configuration#autocontinue) - Keep AI working

---

## Diagnostic Commands

### Doctor Command

The `doctor` command runs a comprehensive health check on your installation:

```bash
npx claude-auto doctor
```

**What it checks:**
- `.claude/` directory structure exists
- All required symlinks are valid
- Hook scripts are accessible and executable
- Configuration files are properly formatted
- Reminders and validators are correctly linked
- No conflicting installations

**Output example:**
```
✅ .claude directory exists
✅ Hook scripts are properly linked
✅ Reminders directory is configured
✅ Validators are accessible
✅ Configuration is valid
✅ Installation is healthy
```

### Repair Command

The `repair` command fixes common installation issues:

```bash
npx claude-auto repair
```

**What it fixes:**
- Recreates missing directories
- Rebuilds broken symlinks
- Restores default hook scripts
- Fixes file permissions on Unix systems
- Regenerates configuration if corrupted

**When to use:**
- After moving your project to a different location
- When symlinks are broken (common on Windows)
- After accidentally deleting `.claude/` files
- When hooks stop working unexpectedly

**Options:**
```bash
# Force repair (overwrites existing files)
npx claude-auto repair --force

# Repair with verbose output
npx claude-auto repair --verbose
```

---

## Support

If diagnostic commands don't resolve your issue:

1. Run `npx claude-auto doctor` first for diagnostics
2. Try `npx claude-auto repair` to fix common issues
3. Check `.claude-auto/logs/` for detailed error messages
4. Report persistent issues at [GitHub Issues](https://github.com/BeOnAuto/claude-auto/issues)