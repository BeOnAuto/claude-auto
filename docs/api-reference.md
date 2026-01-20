# API Reference

Complete reference for all exported functions, types, and interfaces in claude-ketchup.

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

## Skills

### `scanSkills(dir: string): string[]`

Scans the `skills/` subdirectory for `.md` files.

```typescript
import { scanSkills } from 'claude-ketchup';

const skillPaths = scanSkills('/project/.claude');
// → ['/project/.claude/skills/coding.md', ...]
```

---

### `parseSkill(raw: string): ParsedSkill`

Parses a skill file, extracting YAML frontmatter.

```typescript
import { parseSkill } from 'claude-ketchup';

const skill = parseSkill(`---
hook: SessionStart
priority: 100
---

# Skill Content`);

// → { frontmatter: { hook: 'SessionStart', priority: 100 }, content: '# Skill Content' }
```

---

### `filterByHook(skills: ParsedSkill[], hookType: string): ParsedSkill[]`

Filters skills by hook type.

```typescript
import { filterByHook } from 'claude-ketchup';

const sessionStartSkills = filterByHook(skills, 'SessionStart');
```

---

### `filterByMode(skills: ParsedSkill[], mode: string): ParsedSkill[]`

Filters skills by mode (plan/code). Skills without `mode` always pass.

```typescript
import { filterByMode } from 'claude-ketchup';

const codeSkills = filterByMode(skills, 'code');
```

---

### `filterByState(skills: ParsedSkill[], state: State): ParsedSkill[]`

Filters skills by `when` conditions. Skills without `when` always pass.

```typescript
import { filterByState } from 'claude-ketchup';

const activeSkills = filterByState(skills, { projectType: 'typescript' });
```

---

### `sortByPriority(skills: ParsedSkill[]): ParsedSkill[]`

Sorts skills by priority (higher first). Default priority is 0.

```typescript
import { sortByPriority } from 'claude-ketchup';

const sorted = sortByPriority(skills);
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

### `listSkills(claudeDir: string): SkillsResult`

Lists all skills with metadata.

```typescript
import { listSkills } from 'claude-ketchup';

const result = listSkills('/project/.claude');
// → { skills: [{ name: 'coding.md', hook: 'SessionStart', priority: 100 }, ...] }
```

---

### `createCli(): Command`

Creates the Commander CLI instance.

```typescript
import { createCli } from 'claude-ketchup';

const program = createCli();
program.parse();
```

