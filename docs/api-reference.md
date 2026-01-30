# API Reference

Programmatic access to the Quality Stack components.

Use these functions to build custom hooks, integrate with CI/CD, or extend the supervisor system.

---

## Core Utilities

### `findProjectRoot(): string`

Finds the project root directory by walking up the directory tree.

**Search order:**
1. `KETCHUP_ROOT` environment variable
2. Walk up from `INIT_CWD` or `process.cwd()` to find `package.json`
3. Walk up to find `.git` directory
4. Falls back to `process.cwd()`

```typescript
import { findProjectRoot } from 'claude-ketchup';

const root = findProjectRoot();
// → '/Users/sam/my-project'
```

---

### `createSymlink(source: string, target: string): void`

Creates a symbolic link from source to target.

**Behavior:**
- If target exists as symlink pointing elsewhere, removes it first
- If target exists as regular file, renames to `.backup`
- If target already points to source, no-op (idempotent)

```typescript
import { createSymlink } from 'claude-ketchup';

createSymlink('/pkg/scripts/hook.ts', '/project/.claude/scripts/hook.ts');
```

---

### `removeSymlink(target: string): void`

Removes a symbolic link. Does nothing if target is not a symlink.

```typescript
import { removeSymlink } from 'claude-ketchup';

removeSymlink('/project/.claude/scripts/hook.ts');
```

---

### `verifySymlink(target: string, expectedSource: string): boolean`

Checks if a symlink exists and points to the expected source.

```typescript
import { verifySymlink } from 'claude-ketchup';

const valid = verifySymlink(
  '/project/.claude/scripts/hook.ts',
  '/pkg/scripts/hook.ts'
);
// → true
```

---

### `generateGitignore(targetDir: string, symlinkedFiles: string[]): void`

Generates a `.gitignore` file for the `.claude/` directory.

**Includes:**
- All symlinked file paths
- `*.local.*` pattern
- `state.json`
- `logs/`

```typescript
import { generateGitignore } from 'claude-ketchup';

generateGitignore('/project/.claude', ['scripts/hook.ts', 'skills/coding.md']);
```

---

### `mergeSettings(packageDir: string, targetDir: string): void`

Merges settings from multiple sources with lock file caching.

**Sources (in priority order):**
1. `{packageDir}/templates/settings.json` (package defaults)
2. `{targetDir}/settings.project.json` (project overrides)
3. `{targetDir}/settings.local.json` (local overrides)

**Lock file:** Stores SHA-256 hash of inputs. Skips merge if unchanged.

```typescript
import { mergeSettings } from 'claude-ketchup';

mergeSettings('/node_modules/claude-ketchup', '/project/.claude');
```

---

## State Management

### `readState(dir: string): State`

Reads state from `state.json` in the given directory.

```typescript
import { readState } from 'claude-ketchup';

const state = readState('/project/.claude');
// → { projectType: 'typescript', ... }
```

---

### `writeState(dir: string, state: State): void`

Writes state to `state.json`, creating a backup first.

```typescript
import { writeState } from 'claude-ketchup';

writeState('/project/.claude', { projectType: 'typescript' });
```

---

## Reminders

### `scanReminders(dir: string): string[]`

Scans the `reminders/` subdirectory for `.md` files.

```typescript
import { scanReminders } from 'claude-ketchup';

const reminderPaths = scanReminders('/project/.ketchup');
// → ['/project/.ketchup/reminders/coding.md', ...]
```

---

### `parseReminder(raw: string): ParsedReminder`

Parses a reminder file, extracting YAML frontmatter.

```typescript
import { parseReminder } from 'claude-ketchup';

const reminder = parseReminder(`---
when:
  hook: SessionStart
priority: 100
---

# Reminder Content`);

// → { frontmatter: { when: { hook: 'SessionStart' }, priority: 100 }, content: '# Reminder Content' }
```

---

### `filterByHook(reminders: ParsedReminder[], hookType: string): ParsedReminder[]`

Filters reminders by hook type.

```typescript
import { filterByHook } from 'claude-ketchup';

const sessionStartReminders = filterByHook(reminders, 'SessionStart');
```

---

### `filterByMode(reminders: ParsedReminder[], mode: string): ParsedReminder[]`

Filters reminders by mode (plan/code). Reminders without `mode` always pass.

```typescript
import { filterByMode } from 'claude-ketchup';

const codeReminders = filterByMode(reminders, 'code');
```

---

### `filterByState(reminders: ParsedReminder[], state: State): ParsedReminder[]`

Filters reminders by `when` conditions. Reminders without `when` always pass.

```typescript
import { filterByState } from 'claude-ketchup';

const activeReminders = filterByState(reminders, { projectType: 'typescript' });
```

---

### `sortByPriority(reminders: ParsedReminder[]): ParsedReminder[]`

Sorts reminders by priority (higher first). Default priority is 0.

```typescript
import { sortByPriority } from 'claude-ketchup';

const sorted = sortByPriority(reminders);
```

---

## Deny-List

### `loadDenyPatterns(dir: string): string[]`

Loads deny patterns from project and local files.

```typescript
import { loadDenyPatterns } from 'claude-ketchup';

const patterns = loadDenyPatterns('/project/.claude');
// → ['*.secret', '.env', 'dist/**']
```

---

### `isDenied(filePath: string, patterns: string[]): boolean`

Checks if a file path matches any deny pattern using micromatch.

```typescript
import { isDenied } from 'claude-ketchup';

isDenied('/project/.env', ['*.secret', '.env']);
// → true
```

---

## CLI Functions

### `getStatus(packageDir: string): StatusResult`

Returns status of all expected symlinks.

```typescript
import { getStatus } from 'claude-ketchup';

const status = getStatus('/node_modules/claude-ketchup');
// → { symlinks: [{ path: 'scripts/hook.ts', status: 'ok' }, ...] }
```

---

### `repair(packageDir: string, claudeDir: string, files: string[]): RepairResult`

Recreates symlinks for specified files.

```typescript
import { repair } from 'claude-ketchup';

const result = repair(
  '/node_modules/claude-ketchup',
  '/project/.claude',
  ['scripts/hook.ts']
);
// → { repaired: ['scripts/hook.ts'] }
```

---

### `getExpectedSymlinks(packageDir: string): string[]`

Returns list of files that should be symlinked from the package.

```typescript
import { getExpectedSymlinks } from 'claude-ketchup';

const files = getExpectedSymlinks('/node_modules/claude-ketchup');
// → ['scripts/pre-tool-use.ts', 'scripts/user-prompt-submit.ts', 'skills/ketchup.enforced.md', ...]
```

---

### `doctor(packageDir: string, claudeDir: string): DoctorResult`

Diagnoses symlink health.

```typescript
import { doctor } from 'claude-ketchup';

const result = doctor('/node_modules/claude-ketchup', '/project/.claude');
// → { healthy: true, issues: [] }
```

---

### `listReminders(ketchupDir: string): RemindersResult`

Lists all reminders with metadata.

```typescript
import { listReminders } from 'claude-ketchup';

const result = listReminders('/project/.ketchup');
// → { reminders: [{ name: 'coding.md', hook: 'SessionStart', priority: 100 }, ...] }
```

---

### `createCli(): Command`

Creates the Commander CLI instance.

```typescript
import { createCli } from 'claude-ketchup';

const program = createCli();
program.parse();
```

