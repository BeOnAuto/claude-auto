# Ketchup Plan: Rebuild Commit Validation System

## Context

The user asked to rebuild the commit validation system. The old implementation in `.claude.old/scripts/validate-commit.ts` called Claude CLI to validate commits against CLAUDE.md. The new design:

1. **Multiple validators** - Load from `.claude/validators/*.md` instead of single CLAUDE.md check
2. **Configurable** - Use cosmiconfig for config (`.ketchuprc.json`, `package.json` key, etc.)
3. **Parallel execution** - Run all validators via `Promise.all`
4. **Aggregate results** - Collect all NACK reasons into single response
5. **Integrated in pre-tool-use** - No separate Bash hook, pre-tool-use handles both file ops and git commits

Key decisions made:
- CLAUDE.md is left to Claude's native handling - validators are separate
- Always validate (no subagent-type filtering)
- Full diff sent to validators
- Default validators shipped with package, symlinked on postinstall
- Use `cosmiconfig` for config, `gray-matter` for frontmatter parsing

## TODO

(none)

## DONE

### Bottle: Config Loader
- [x] Burst 1: loadConfig returns empty object when no config exists [depends: none]
- [x] Burst 2: loadConfig reads from .ketchuprc.json [depends: 1]
- [x] Burst 3: loadConfig reads from package.json ketchup key [depends: 1]

### Bottle: Validator Loader
- [x] Burst 4: loadValidators returns empty array when dir missing [depends: none]
- [x] Burst 5: loadValidators parses single .md file with frontmatter [depends: 4]
- [x] Burst 6: loadValidators filters disabled validators [depends: 5]
- [x] Burst 7: loadValidators loads from multiple directories [depends: 5]

### Bottle: Commit Validator
- [x] Burst 8: isCommitCommand detects git commit in bash command [depends: none]
- [x] Burst 9: getCommitContext extracts diff, files, message [depends: none]
- [x] Burst 10: runValidator calls Claude CLI with prompt [depends: 5]
- [x] Burst 11: runValidator parses ACK/NACK response [depends: 10]
- [x] Burst 12: validateCommit runs validators in parallel [depends: 11]
- [x] Burst 13: validateCommit aggregates NACK reasons [depends: 12]

### Bottle: Pre-Tool-Use Integration
- [x] Burst 14: handlePreToolUse routes Bash commands to commit validator [depends: 12]
- [x] Burst 15: handlePreToolUse returns block with aggregated reasons [depends: 14]

### Bottle: Postinstall & Template
- [x] Burst 16: postinstall symlinks validators directory [depends: none]
- [x] Burst 17: Remove Bash matcher from template, update PreToolUse matcher [depends: 14]

### Bottle: Default Validators
- [x] Burst 18: Create ketchup-rules.md validator [depends: 5]
- [x] Burst 19: Create no-dangerous-git.md validator [depends: 5]

### Bottle: Split Validators
- [x] Burst 20: Update CLAUDE.md Plea → Appeal (SKIPPED - protected by deny-list)
- [x] Burst 21: Create burst-atomicity.md validator [depends: none]
- [x] Burst 22: Create coverage-rules.md validator [depends: none]
- [x] Burst 23: Create testing-practices.md validator [depends: none]
- [x] Burst 24: Create no-comments.md validator [depends: none]
- [x] Burst 25: Create backwards-compat.md validator [depends: none]
- [x] Burst 26: Create infra-commit-format.md validator [depends: none]
- [x] Burst 27: Remove ketchup-rules.md [depends: 21-26]
- [x] Burst 28: Update default-validators.test.ts [depends: 27]

### Bottle: Appeal System
- [x] Burst 29: extractAppeal function in commit-validator.ts [depends: 20]
- [x] Burst 30: isValidAppeal function with whitelist [depends: 29]
- [x] Burst 31: Add appealable flag to validator results [depends: 30]
- [x] Burst 32: handleCommitValidation applies appeal logic [depends: 31]
- [x] Burst 33: Block message includes appeal instructions [depends: 32]

### Bottle: Reminders System (Replaces Skills)
- [x] Burst 34-45: Core reminder-loader.ts with scan, parse, match, sort [depends: none]
- [x] Burst 46: session-start uses reminder-loader [depends: 45]
- [x] Burst 47: user-prompt-submit uses reminder-loader [depends: 45]
- [x] Burst 48: pre-tool-use uses reminder-loader with toolName context [depends: 45]
- [x] Burst 49-50: CLI reminders command [depends: 45]
- [x] Burst 51: Create reminders/ketchup.md from skills/ketchup.enforced.md [depends: 45]
- [x] Burst 52: Update index.ts exports [depends: 45]
- [x] Burst 53: Update postinstall/repair to symlink reminders/ [depends: 51]
- [x] Burst 54-57: Delete skills system (skills-loader, cli/skills, skills/) [depends: 46-53]

## Architecture Details

### Config Schema
```typescript
interface KetchupConfig {
  validators?: {
    dirs?: string[];  // Additional validator directories (default: [".claude/validators"])
    enabled?: boolean; // Master enable/disable (default: true)
    mode?: "on" | "off" | "warn";  // on=block, off=skip, warn=log only
  };
}
```

### Validator Format
```markdown
---
name: coverage-check
description: Ensures test coverage for new code
enabled: true
---

You are validating a git commit. Check that:
...

Respond with JSON: {"decision":"ACK"} or {"decision":"NACK","reason":"..."}
```

### Validator Prompt Structure
```
<diff>
{full git diff of staged changes}
</diff>

<commit-message>
{the commit message}
</commit-message>

<files>
{list of changed files}
</files>

{validator .md content after frontmatter}
```

### Files Created
- `src/config-loader.ts` + tests
- `src/validator-loader.ts` + tests
- `src/commit-validator.ts` + tests
- `validators/no-dangerous-git.md`
- `validators/burst-atomicity.md`
- `validators/coverage-rules.md`
- `validators/testing-practices.md`
- `validators/no-comments.md`
- `validators/backwards-compat.md`
- `validators/infra-commit-format.md`

### Files Modified
- `src/hooks/pre-tool-use.ts` - add commit validation branch
- `src/postinstall.ts` - add validators to SYMLINK_DIRS
- `templates/settings.json` - remove Bash matcher, expand PreToolUse matcher to include Bash
- `package.json` - add cosmiconfig, gray-matter

### Appeal System
Valid appeals: `coherence`, `existing-gap`, `debug-branchless`
Format: `[appeal: justification]` in commit message
Non-appealable: `no-dangerous-git` (--force and --no-verify always blocked)

### Reminders System
Reminders replace the `.enforced.md` skills system with conditional injection based on context.

**Frontmatter Schema:**
```yaml
---
when:
  hook: SessionStart | PreToolUse | UserPromptSubmit | Stop
  mode: plan | explore | work | unknown
  toolName: Bash | Edit | Write | Read | ...  # PreToolUse only
  customKey: value  # any key from .claude.hooks.json state
priority: 100  # higher = first (default: 0)
---
```

**Matching Rules:**
- No `when:` = unconditional, always matches
- All conditions use implicit AND (all must match)
- Unspecified keys = not checked (wildcard)

**Files Created:**
- `src/reminder-loader.ts` + tests
- `src/cli/reminders.ts` + tests
- `reminders/ketchup.md`

**Files Deleted:**
- `src/skills-loader.ts` + tests
- `src/cli/skills.ts` + tests
- `skills/` directory

### Note
CLAUDE.md still uses "plea" terminology - needs manual update to "appeal" (protected by deny-list).
