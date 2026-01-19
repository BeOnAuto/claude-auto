# /clean-logs - Clean Old Log Files

Remove log files from `.claude/logs` that haven't been modified recently.

## Usage

```
/clean-logs [minutes]
```

- `minutes`: Delete files older than this (default: 60)

## Implementation

Run the cleanup script:

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/scripts/clean-logs.ts" $ARGUMENTS
```

Report the results to the user.
