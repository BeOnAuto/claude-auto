# Installation Guide

Claude Auto is a plugin for Claude Code. There are two ways to install it.

---

## Option 1: Marketplace (Recommended)

```
/plugin marketplace add BeOnAuto/claude-auto
/plugin install claude-auto@beon-auto
```

This installs the plugin and registers all hooks and skills automatically.

---

## Option 2: Local Plugin Mode

For development or when working from a local clone:

```bash
claude --plugin-dir /path/to/claude-auto
```

---

## What Gets Created

After the plugin activates, the following structure is created in your project:

```
your-project/
├── .claude-auto/
│   ├── reminders/          # Context injection files (*.md)
│   ├── validators/         # Commit validation rules (*.md)
│   ├── .claude.hooks.json  # Hook behavior state
│   └── logs/
│       └── activity.log    # Activity log
```

See the [Reminders Guide](/reminders-guide) and [Validators Guide](/validators-guide) for the complete list of built-in reminders and validators.

---

## Verify Installation

After installing the plugin, use the config skill to check the current state:

```
/claude-auto:config show
```

---

## Configuration

All configuration is managed via the `/claude-auto:config` skill:

```
/claude-auto:config show          # View current configuration
/claude-auto:config set <key> <value>  # Update a setting
/claude-auto:config validators    # List active validators
/claude-auto:config reminders     # List active reminders
```

Configuration is stored in `.claude-auto/.claude.hooks.json`.

---

## Troubleshooting

### Hooks not firing

1. Verify the plugin is installed: check that Claude Code shows claude-auto in the active plugins
2. Ensure you're in the project root when starting Claude
3. Check logs in `.claude-auto/logs/` for errors

### Permission denied

On Unix systems, you might need to fix permissions:

```bash
chmod +x .claude-auto/scripts/*.js
```

---

## Uninstall

Remove the plugin via Claude Code:

```
/plugin uninstall claude-auto
```

To clean up project files:

```bash
rm -rf .claude-auto
```

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `AUTO_ROOT` | Force project root path | Auto-detected |
| `DEBUG` | Enable debug logging | - |

---

## Next Steps

After installation:

1. [Configure your hooks](/hooks-guide) - Customize supervision rules
2. [Add reminders](/configuration#reminder-frontmatter) - Inject your guidelines
3. [Set up file protection](/hooks-guide#protect-files-with-deny-list) - Protect sensitive files
4. [Enable auto-continue](/configuration#autocontinue) - Keep AI working

---

## Support

If you run into issues:

1. Run `/claude-auto:config show` to check configuration state
2. Check `.claude-auto/logs/` for detailed error messages
3. Report persistent issues at [GitHub Issues](https://github.com/BeOnAuto/claude-auto/issues)
