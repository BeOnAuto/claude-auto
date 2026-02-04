# API Reference

Programmatic access to the Quality Loop components.

Use these functions to build custom hooks, integrate with CI/CD, or extend the supervisor system.

---

## Types

### `Reminder`

A parsed reminder with metadata and content.

```typescript
interface Reminder {
  name: string;
  when: ReminderWhen;
  priority: number;
  content: string;
}
```

| Property | Type | Description |
| -------- | ---- | ----------- |
| `name` | `string` | Filename without `.md` extension |
| `when` | `ReminderWhen` | Conditions for when this reminder applies |
| `priority` | `number` | Sort order (higher = earlier). Default: `0` |
| `content` | `string` | Markdown body (trimmed, without frontmatter) |

---

### `ReminderWhen`

Conditions that control when a reminder is active.

```typescript
interface ReminderWhen {
  hook?: string;
  mode?: string;
  toolName?: string;
  [key: string]: unknown;
}
```

All conditions use AND logic — every key/value pair must match the context.

---

### `ReminderContext`

Context passed to `matchReminders` and `loadReminders` for filtering.

```typescript
interface ReminderContext {
  hook: string;
  mode?: string;
  toolName?: string;
  [key: string]: unknown;
}
```

---

### `InstallResult`

Result returned by the `install` function.

```typescript
type InstallResult = {
  targetDir: string;
  claudeDir: string;
  settingsCreated: boolean;
  status: 'installed' | 'updated';
};
```

| Property | Type | Description |
| -------- | ---- | ----------- |
| `targetDir` | `string` | Resolved absolute path to the project root |
| `claudeDir` | `string` | Path to the `.claude/` directory |
| `settingsCreated` | `boolean` | `true` if `settings.json` was created (not already present) |
| `status` | `'installed' \| 'updated'` | `'installed'` on first run, `'updated'` on subsequent runs |

---

## Core Utilities

### `findProjectRoot(): string`

Finds the project root directory by walking up the directory tree.

**Search order:**
1. `AUTO_ROOT` environment variable (if set and path exists)
2. Walk up from `INIT_CWD` to find `package.json`
3. Walk up from `INIT_CWD` to find `.git` directory
4. Falls back to `process.cwd()`

```typescript
import { findProjectRoot } from 'claude-auto';

const root = findProjectRoot();
// → '/Users/sam/my-project'
```

**Edge cases (from tests):**
- Returns `process.cwd()` when `INIT_CWD` path does not exist
- Returns `process.cwd()` when no env vars are set
- Walks up nested directories to find the nearest `package.json`
- Falls back to `.git` detection when no `package.json` found

---

### `createSymlink(source: string, target: string): void`

Creates a symbolic link from source to target.

**Behavior:**
- If target is a symlink pointing elsewhere, removes it first (no backup)
- If target is a regular file, renames to `.backup` before creating symlink
- If target already points to source, no-op (idempotent — same inode preserved)

```typescript
import { createSymlink } from 'claude-auto';

createSymlink('/pkg/scripts/hook.js', '/project/.claude-auto/scripts/hook.js');
```

---

### `removeSymlink(target: string): void`

Removes a symbolic link. Does nothing if target is not a symlink (preserves regular files).

```typescript
import { removeSymlink } from 'claude-auto';

removeSymlink('/project/.claude-auto/scripts/hook.js');
```

---

### `verifySymlink(target: string, expectedSource: string): boolean`

Checks if a symlink exists and points to the expected source.

Returns `false` when:
- Target does not exist
- Target is not a symlink (regular file)
- Target points to a different source

```typescript
import { verifySymlink } from 'claude-auto';

const valid = verifySymlink(
  '/project/.claude-auto/scripts/hook.js',
  '/pkg/scripts/hook.js'
);
// → true
```

---

### `generateGitignore(targetDir: string, symlinkedFiles: string[]): void`

Generates a `.gitignore` file in the target directory.

**Includes (in order):**
1. All symlinked file paths
2. `*.local.*` pattern
3. `state.json`
4. `logs/`

```typescript
import { generateGitignore } from 'claude-auto';

generateGitignore('/project/.claude', ['scripts/session-start.ts']);
// Creates .gitignore with content:
// scripts/session-start.ts
// *.local.*
// state.json
// logs/
```

---

### `mergeSettings(packageDir: string, targetDir: string): void`

Merges settings from multiple sources with lock file caching.

**Sources (in priority order):**
1. `{packageDir}/templates/settings.json` (package defaults)
2. `{targetDir}/settings.project.json` (project overrides)
3. `{targetDir}/settings.local.json` (local overrides)

**Lock file:** Stores SHA-256 hash of inputs. Skips merge if unchanged. Re-merges when inputs change.

**Merge behaviors:**
- **Default (array append):** Hook arrays from all layers are concatenated, then deduplicated by command (last occurrence wins)
- **`_disabled` array:** Removes hooks matching specified commands from the base
- **`_mode: 'replace'`:** Replaces the entire hook array with `_value` (or empty array if no `_value`)
- **Non-hooks keys:** Deep merged (e.g., `permissions`, `customKey`)
- **No-op:** Does nothing when package template doesn't exist

```typescript
import { mergeSettings } from 'claude-auto';

mergeSettings('/node_modules/claude-auto', '/project/.claude');
```

---

## State Management

### `readState(dir: string): Record<string, unknown>`

Reads state from `state.json` in the given directory. Returns empty object when file doesn't exist.

```typescript
import { readState } from 'claude-auto';

const state = readState('/project/.claude');
// → { lastRun: '2024-01-01', counter: 5 }
// → {} (when state.json doesn't exist)
```

---

### `writeState(dir: string, state: Record<string, unknown>): void`

Writes state to `state.json`. Creates a backup at `state.backup.json` before overwriting existing state.

```typescript
import { writeState } from 'claude-auto';

writeState('/project/.claude', { lastRun: '2024-01-01', counter: 5 });
// Also creates state.backup.json with previous contents
```

---

## Reminders

### `scanReminders(remindersDir: string): string[]`

Scans a directory for `.md` files. Returns filenames (not full paths). Returns empty array when directory doesn't exist. Non-`.md` files are ignored.

```typescript
import { scanReminders } from 'claude-auto';

const filenames = scanReminders('/project/.claude-auto/reminders');
// → ['ketchup.md', 'plan-mode.md']
```

---

### `parseReminder(content: string, filename: string): Reminder`

Parses a reminder file's raw content, extracting YAML frontmatter and body.

```typescript
import { parseReminder } from 'claude-auto';

const reminder = parseReminder(
  `---
when:
  hook: SessionStart
  mode: plan
priority: 100
---

Ask clarifying questions until crystal clear.`,
  'plan-mode.md'
);

// → {
//   name: 'plan-mode',
//   when: { hook: 'SessionStart', mode: 'plan' },
//   priority: 100,
//   content: 'Ask clarifying questions until crystal clear.'
// }
```

When no frontmatter is present, returns empty `when` and priority `0`:

```typescript
const simple = parseReminder('# Simple\n\nJust content.', 'simple.md');
// → { name: 'simple', when: {}, priority: 0, content: '# Simple\n\nJust content.' }
```

---

### `matchReminders(reminders: Reminder[], context: ReminderContext): Reminder[]`

Filters reminders by context. All `when` conditions use AND logic — every key/value pair in `when` must match the corresponding key in `context`.

Reminders with empty `when` always match.

```typescript
import { matchReminders } from 'claude-auto';
import type { Reminder, ReminderContext } from 'claude-auto';

const reminders: Reminder[] = [
  { name: 'always', when: {}, priority: 0, content: 'Always shown' },
  { name: 'session-only', when: { hook: 'SessionStart' }, priority: 0, content: 'Session' },
  { name: 'plan-mode', when: { mode: 'plan' }, priority: 0, content: 'Plan' },
  { name: 'session-plan', when: { hook: 'SessionStart', mode: 'plan' }, priority: 0, content: 'Both' },
  { name: 'bash-tool', when: { hook: 'PreToolUse', toolName: 'Bash' }, priority: 0, content: 'Bash' },
];

const context: ReminderContext = { hook: 'SessionStart', mode: 'plan' };
const result = matchReminders(reminders, context);

// → ['always', 'session-only', 'plan-mode', 'session-plan']
// 'bash-tool' excluded: hook doesn't match
```

---

### `sortByPriority(reminders: Reminder[]): Reminder[]`

Sorts reminders by priority (highest first). Returns a new array (does not mutate input). Default priority is `0`.

```typescript
import { sortByPriority } from 'claude-auto';

const sorted = sortByPriority(reminders);
// Priority 100 → 50 → 10 → 0
```

---

### `loadReminders(remindersDir: string, context: ReminderContext): Reminder[]`

High-level function that scans, parses, matches, and sorts reminders from a directory in one call.

Equivalent to: `sortByPriority(matchReminders(reminders.map(parseReminder), context))`

```typescript
import { loadReminders } from 'claude-auto';
import type { ReminderContext } from 'claude-auto';

const context: ReminderContext = { hook: 'SessionStart' };
const reminders = loadReminders('/project/.claude-auto/reminders', context);
// → Sorted, filtered reminders matching SessionStart hook
```

**Behavior (from tests):**
- Reads all `.md` files from the directory
- Parses each with `parseReminder`
- Filters using `matchReminders` against the context
- Sorts by priority (highest first)
- Reminders whose `when` conditions don't match the context are excluded

---

## Deny-List

### `loadDenyPatterns(dir: string): string[]`

Loads deny patterns from project and local files. Returns empty array when no files exist.

**Sources:**
1. `{dir}/deny-list.project.txt` — project-wide patterns
2. `{dir}/deny-list.local.txt` — personal patterns

Empty lines and lines starting with `#` (comments) are ignored. Patterns from both files are merged.

```typescript
import { loadDenyPatterns } from 'claude-auto';

const patterns = loadDenyPatterns('/project/.claude');
// → ['*.secret', '/private/**', '/my-local/**']
```

---

### `isDenied(filePath: string, patterns: string[]): boolean`

Checks if a file path matches any deny pattern using [micromatch](https://github.com/micromatch/micromatch) glob matching.

Returns `false` when patterns array is empty.

```typescript
import { isDenied } from 'claude-auto';

isDenied('/config/api.secret', ['*.secret', '/private/**']);
// → true

isDenied('/config/api.json', ['*.secret', '/private/**']);
// → false

isDenied('/any/path.txt', []);
// → false
```

---

## CLI Functions

### `install(targetPath?: string, options?: { local?: boolean }): Promise<InstallResult>`

Installs Claude Auto into a project directory. Creates `.claude/` and `.claude-auto/` directories, copies hook scripts, validators, and reminders, and initializes hook state.

**Standard install:**
- Creates `settings.json` from package template (skips if already exists)
- Copies bundled scripts to `.claude-auto/scripts/`
- Copies validators to `.claude-auto/validators/`
- Copies reminders to `.claude-auto/reminders/`
- Initializes `.claude-auto/.claude.hooks.json` with defaults (`autoContinue.mode: 'smart'`, `validateCommit.mode: 'strict'`, `denyList.enabled: true`)

**Local install** (`{ local: true }`):
- Creates `settings.json` from local template (uses `pnpm tsx` commands instead of `node`)
- Does NOT copy scripts, validators, or reminders
- Still initializes hook state

**Idempotent:** Running twice succeeds. Does not overwrite existing `settings.json`.

```typescript
import { install } from 'claude-auto';

const result = await install('/path/to/project');
// → { targetDir: '/path/to/project', claudeDir: '/path/to/project/.claude', settingsCreated: true, status: 'installed' }

const result2 = await install('/path/to/project');
// → { ...same paths..., settingsCreated: false, status: 'updated' }
```

---

### `getStatus(packageDir: string, claudeDir: string): Promise<StatusResult>`

Returns status of all expected symlinks, including both `.claude/` and `.claude-auto/` files.

```typescript
import { getStatus } from 'claude-auto';

const status = await getStatus('/node_modules/claude-auto', '/project/.claude');
// → {
//   symlinks: [
//     { path: 'commands/cmd.md', status: 'ok' },
//     { path: '.claude-auto/validators/rule.md', status: 'ok' },
//     { path: '.claude-auto/reminders/reminder.md', status: 'ok' }
//   ]
// }
```

---

### `getExpectedSymlinks(packageDir: string): { claudeFiles: string[], autoFiles: string[] }`

Returns lists of files that should be symlinked, separated by target directory.

- `claudeFiles`: Files from `commands/` (symlinked to `.claude/commands/`)
- `autoFiles`: Files from `.claude-auto/validators/` and `.claude-auto/reminders/` (symlinked to `.claude-auto/`)

```typescript
import { getExpectedSymlinks } from 'claude-auto';

const files = getExpectedSymlinks('/node_modules/claude-auto');
// → {
//   claudeFiles: ['commands/cmd.md'],
//   autoFiles: ['validators/rule.md', 'reminders/reminder.md']
// }
```

---

### `repair(packageDir: string, claudeDir: string, files: { claudeFiles: string[], autoFiles: string[] }): Promise<RepairResult>`

Recreates symlinks for specified files. Claude files are linked to `.claude/`, auto files to `.claude-auto/`.

```typescript
import { getExpectedSymlinks, repair } from 'claude-auto';

const files = getExpectedSymlinks('/node_modules/claude-auto');
const result = await repair('/node_modules/claude-auto', '/project/.claude', files);
// → { repaired: ['commands/cmd.md', '.claude-auto/validators/rule.md'] }
```

---

### `doctor(packageDir: string, claudeDir: string): Promise<DoctorResult>`

Diagnoses symlink health for both `.claude/` and `.claude-auto/` directories.

```typescript
import { doctor } from 'claude-auto';

const result = await doctor('/node_modules/claude-auto', '/project/.claude');
// → { healthy: true, issues: [] }
// → { healthy: false, issues: ['Missing or invalid symlink: /project/.claude/commands/cmd.md'] }
```

---

### `listReminders(remindersDir: string): RemindersResult`

Lists all reminders with their metadata (without content).

```typescript
import { listReminders } from 'claude-auto';

const result = listReminders('/project/.claude-auto/reminders');
// → {
//   reminders: [
//     { name: 'plan-mode', when: { hook: 'SessionStart', mode: 'plan' }, priority: 100 }
//   ]
// }
```

---

### `createCli(): Command`

Creates the Commander CLI instance with all subcommands registered.

```typescript
import { createCli } from 'claude-auto';

const program = createCli();
program.parse();
```
