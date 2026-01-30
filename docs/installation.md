# Installation Guide

Complete guide for installing and configuring Claude Ketchup in your project.

---

## Quick Install

```bash
npx claude-ketchup install
```

That's it! This single command sets up everything you need.

---

## What Gets Installed

When you run `npx claude-ketchup install`:

1. Creates `.claude/` and `.ketchup/` directories
2. Symlinks hook scripts for session management and validation
3. Generates configuration files (settings.json, .gitignore)
4. Sets up built-in reminders and validators

See the [Architecture Guide](/architecture#directory-structure) for complete directory structure details.

See the [Reminders Guide](/reminders-guide) and [Validators Guide](/validators-guide) for the complete list of built-in reminders and validators.

---

## Verify Installation

After installation, verify everything is set up correctly:

```bash
npx claude-ketchup doctor
```

You should see green checkmarks for all components:

```
✓ Project root found
✓ .claude directory exists
✓ .ketchup directory exists
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
mkdir -p .claude/scripts .claude/commands
mkdir -p .ketchup/reminders .ketchup/validators

# Create initial configuration
cat > .claude.hooks.json << 'EOF'
{
  "autoContinue": {
    "mode": "smart",
    "maxIterations": 0
  },
  "validateCommit": {
    "mode": "strict"
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
          { "type": "command", "command": "npx tsx .claude/scripts/session-start.ts" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|NotebookEdit|Bash",
        "hooks": [
          { "type": "command", "command": "npx tsx .claude/scripts/pre-tool-use.ts" }
        ]
      }
    ]
  }
}
```

### Step 3: Add custom reminders

Create `.ketchup/reminders/my-project.md`:

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

If `npx claude-ketchup` doesn't work:

```bash
# Install globally
npm install -g claude-ketchup

# Then run
claude-ketchup install
```

### Permission denied

On Unix systems, you might need to fix permissions:

```bash
chmod +x .claude/scripts/*.ts
```

### Symlinks not created

If symlinks fail (common on Windows without admin rights):

```bash
# Run repair command
npx claude-ketchup repair

# Or manually copy files instead of symlinking
cp -r node_modules/claude-ketchup/scripts/* .claude/scripts/
```

### Hooks not firing

Verify Claude Code can find your settings:

1. Check `.claude/settings.json` exists
2. Ensure you're in the project root when starting Claude
3. Check logs in `.claude/logs/` for errors

---

## Uninstall

To remove Claude Ketchup from your project:

```bash
# Remove directories
rm -rf .claude .ketchup

# Remove state file
rm -f .claude.hooks.json

# Remove from package.json if installed
npm uninstall claude-ketchup
```

---

## Environment Variables

Control installation behavior with these environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `KETCHUP_ROOT` | Force project root path | Auto-detected |
| `KETCHUP_SKIP_POSTINSTALL` | Skip automatic setup | `false` |
| `DEBUG` | Enable debug logging | - |

Example:

```bash
# Install with debug logging
DEBUG=ketchup* npx claude-ketchup install

# Install in specific directory
KETCHUP_ROOT=/path/to/project npx claude-ketchup install
```

---

## CI/CD Integration

### Skip installation in CI

Set environment variable to skip postinstall:

```yaml
# GitHub Actions
env:
  KETCHUP_SKIP_POSTINSTALL: true
```

### Docker

Add to Dockerfile:

```dockerfile
# Install without postinstall
ENV KETCHUP_SKIP_POSTINSTALL=true
RUN npm install

# Manually run install when needed
RUN npx claude-ketchup install
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
npx claude-ketchup doctor
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
npx claude-ketchup repair
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
npx claude-ketchup repair --force

# Repair with verbose output
npx claude-ketchup repair --verbose
```

---

## Support

If diagnostic commands don't resolve your issue:

1. Run `npx claude-ketchup doctor` first for diagnostics
2. Try `npx claude-ketchup repair` to fix common issues
3. Check `.claude/logs/` for detailed error messages
4. Report persistent issues at [GitHub Issues](https://github.com/xolvio/claude-ketchup/issues)