# API Reference

Programmatic access to Claude Auto's exported utilities.

These are the functions and types exported from `claude-auto` via `src/index.ts`.

---

## Path Resolution

### `resolvePathsFromEnv(explicitPluginRoot?: string): ResolvedPaths`

Resolves the key directory paths used by Claude Auto, based on environment variables and optional explicit plugin root.

```typescript
import { resolvePathsFromEnv } from 'claude-auto';

const paths = resolvePathsFromEnv();
// → { pluginRoot: '...', projectRoot: '...', autoDir: '...', ... }
```

With an explicit plugin root:

```typescript
const paths = resolvePathsFromEnv('/path/to/claude-auto');
```

---

## Types

### `ResolvedPaths`

The resolved directory paths used by the plugin.

```typescript
import type { ResolvedPaths } from 'claude-auto';
```

---

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

### `OverridesState`

State object for managing validator and reminder overrides.

```typescript
import type { OverridesState } from 'claude-auto';
```

---

### `ReminderOverride`

Override configuration for a specific reminder.

```typescript
import type { ReminderOverride } from 'claude-auto';
```

---

### `ValidatorOverride`

Override configuration for a specific validator.

```typescript
import type { ValidatorOverride } from 'claude-auto';
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
