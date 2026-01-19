# claude-ketchup

Husky-style hooks and skills management for Claude Code.

## Installation

```bash
pnpm add claude-ketchup
```

On install, claude-ketchup automatically:
- Creates a `.claude` directory in your project root
- Symlinks `scripts/`, `skills/`, and `commands/` from the package
- Generates a `.gitignore` for symlinked and runtime files
- Copies default settings from `templates/settings.json`

## Testing Locally

To test the package in a separate project:

```bash
# In claude-ketchup directory
pnpm link --global

# In your test project
pnpm link --global claude-ketchup
```

Or test the postinstall directly:

```bash
# Set KETCHUP_ROOT to your test project
KETCHUP_ROOT=/path/to/test-project npx tsx bin/postinstall.ts
```

## Development

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Watch mode
pnpm test:watch
```

## How It Works

### Postinstall

1. **Detects project root** using (in order):
   - `KETCHUP_ROOT` environment variable
   - `INIT_CWD` (set by npm/pnpm during install)
   - Walk up to find `package.json`
   - Walk up to find `.git`
   - Falls back to `cwd()`

2. **Creates `.claude` directory** in the project root

3. **Symlinks files** from package `scripts/`, `skills/`, `commands/` to `.claude/`

4. **Generates `.gitignore`** with:
   - Symlinked file paths
   - `*.local.*` pattern (for local overrides)
   - Runtime files (`state.json`, `logs/`)

5. **Merges settings** from `templates/settings.json`

### Preuninstall

- Removes all symlinks from `.claude/scripts/`, `.claude/skills/`, `.claude/commands/`
- Preserves local files (non-symlinks)

## Project Structure

```
claude-ketchup/
├── bin/
│   ├── postinstall.ts    # Entry point for postinstall
│   └── preuninstall.ts   # Entry point for preuninstall
├── src/
│   ├── root-finder.ts    # Project root detection
│   ├── linker.ts         # Symlink management
│   ├── gitignore-manager.ts
│   ├── settings-merger.ts
│   ├── postinstall.ts    # Main postinstall logic
│   └── preuninstall.ts   # Main preuninstall logic
├── templates/
│   └── settings.json     # Default Claude settings
├── scripts/              # Hook scripts (symlinked)
├── skills/               # Skill definitions (symlinked)
└── commands/             # Command definitions (symlinked)
```

## License

MIT
