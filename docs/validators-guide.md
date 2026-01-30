# Validators Guide

Complete guide to using validators to enforce commit quality and project standards.

---

## What Are Validators?

Validators are rules that automatically check every commit against your project's quality standards. They act as an impartial reviewer that ensures consistency and prevents common mistakes.

Think of validators as:
- **Quality gates** that prevent bad code from landing
- **Teaching tools** that reinforce best practices
- **Time savers** that catch issues before review

---

## How Validators Work

```
Claude attempts commit
         │
         ▼
┌─────────────────────────┐
│  PreToolUse hook fires  │
│  (for git commit)       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Load validators from:  │
│  - .ketchup/validators/ │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  For each validator:    │
│  - Parse frontmatter    │
│  - Check if enabled     │
│  - Send to Claude       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Claude evaluates       │
│  Returns ACK or NACK    │
└──────────┬──────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
  ACK           NACK
Commit        Block +
proceeds      explain why
```

---

## What Validators See

When evaluating a commit, validators receive comprehensive information about the change:

### Available Information

1. **Full Git Diff** - The complete diff output showing all changes
   - Added lines (with `+` prefix)
   - Removed lines (with `-` prefix)
   - Context lines around changes
   - File modification hunks

2. **Commit Message** - The full commit message text
   - Subject line
   - Body text
   - Any special markers (e.g., `plea:` reasons)

3. **Modified Files List** - All files affected by the commit
   - File paths relative to project root
   - Allows file-specific validation rules
   - Can detect patterns like `*.test.*` or `migrations/**`

### How Validators Use This Information

Validators can make intelligent decisions based on:

- **Code patterns**: Detect specific code constructs in the diff (e.g., `console.log`, `any` types, `.skip()`)
- **File types**: Apply rules only to specific file patterns (e.g., only validate `.ts` files, skip test files)
- **Change scope**: Evaluate architectural impact by seeing which files are modified together
- **Commit metadata**: Check commit message format, conventions, and plea justifications

### Example Analysis

```typescript
// Validator can see in the diff:
+ console.log('debug info');  // ← NACK: console.log in production code

// And in the file list:
src/user-service.ts  // ← Non-test file, apply strict rules

// And in commit message:
"fix: update user validation"  // ← Check conventional commit format
```

This comprehensive view allows validators to enforce context-aware quality standards.

---

## Built-in Validators

Claude Ketchup includes 17 pre-configured validators:

### Commit Quality

- **backwards-compatibility.md** - Warns about breaking changes
- **claude-code-footprint.md** - Removes "Generated with Claude Code" signatures
- **commit-message-format.md** - Enforces conventional commit format
- **plea-system-valid.md** - Validates plea reasons in commits

### Code Quality

- **emergent-design.md** - Ensures types emerge from tests
- **extreme-ownership.md** - Fix problems you encounter
- **no-comments-in-code.md** - Enforces self-documenting code
- **test-title-equals-test-body.md** - Test names match assertions
- **tests-in-same-commit.md** - Tests ship with implementation

### Safety

- **no-dangerous-git-operations.md** - Prevents force push, hard reset
- **no-skipped-tests.md** - No .skip() or .only() in tests
- **no-type-escape-hatches.md** - No `any`, `@ts-ignore`, `as` casts

### Workflow

- **parallelization-awareness.md** - Ensures parallel burst execution
- **tcr-workflow.md** - Enforces Test && Commit || Revert
- **test-coverage.md** - Maintains 100% coverage
- **when-to-create-documentation.md** - Documents only when needed

---

## Validator Frontmatter

Each validator has YAML frontmatter:

```yaml
---
name: unique-identifier
description: What this validator checks
enabled: true
---
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the validator |
| `description` | string | Yes | Brief explanation of what it validates |
| `enabled` | boolean | No | Whether validator is active (default: true) |

---

## Validation Modes

Control validation strictness in `.claude.hooks.json`:

```json
{
  "validateCommit": {
    "mode": "strict"
  }
}
```

### Modes

| Mode | Behavior | Use When |
|------|----------|----------|
| `strict` | Blocks violating commits (NACK) | Production projects |
| `warn` | Warns but allows commits | Learning phase |
| `off` | No validation | Quick experiments |

---

## Creating Custom Validators

### Basic Validator

Create `.ketchup/validators/no-console-logs.md`:

```markdown
---
name: no-console-logs
description: Prevents console.log statements in production code
enabled: true
---

# No Console Logs

Check that the commit doesn't add any `console.log` statements.

## What to check:
- No new `console.log(` in JavaScript/TypeScript files
- No new `print(` in Python files
- No new `println(` in Java/Kotlin files

## Exceptions:
- Test files (`*.test.*`, `*.spec.*`)
- Debug utilities explicitly meant for logging
- Commented out code (though this should also be avoided)

## Why this matters:
- Console logs can leak sensitive information
- They clutter production logs
- They impact performance in tight loops
- Professional code uses proper logging libraries

NACK if console.log statements are found in non-test files.
```

### Advanced Validator

```markdown
---
name: api-response-format
description: Ensures all API responses follow team format
enabled: true
---

# API Response Format Validator

All API endpoint modifications must follow our response format.

## Required Format:
```typescript
{
  success: boolean,
  data?: any,
  error?: {
    code: string,
    message: string,
    details?: any
  },
  metadata?: {
    timestamp: string,
    requestId: string
  }
}
```

## Check for:
1. New/modified route handlers return this format
2. Error handlers transform errors to this format
3. Success responses include `success: true`
4. Error responses include `success: false` and error object

## Files to check:
- `**/controllers/**/*.ts`
- `**/routes/**/*.ts`
- `**/handlers/**/*.ts`

NACK if API responses don't match the required format.
```

---

## Conditional Validators

### Enable/Disable by Project State

Control validators based on project phase:

```markdown
---
name: strict-typing
description: Enforces strict TypeScript settings
enabled: true
when:
  projectType: typescript
  phase: production
---

# Strict TypeScript Validation

In production phase, ensure:
- No implicit any
- Strict null checks
- No unused parameters
- No unused locals

NACK if TypeScript strict mode violations exist.
```

### Enable for Specific Files

Target validators to specific areas:

```markdown
---
name: database-migration-safety
description: Validates database migrations
enabled: true
---

# Database Migration Safety

When files in `migrations/` are modified:

1. No DROP TABLE in production
2. All ALTER TABLE must be backwards compatible
3. New columns must have defaults or be nullable
4. Include rollback migration

NACK if unsafe migration patterns detected.
```

---

## Validator Enforcement Levels

Different validators can have different enforcement levels:

### Critical (Always NACK)

```markdown
---
name: no-secrets
description: Prevents committing secrets
enabled: true
severity: critical
---

# No Secrets in Code

IMMEDIATELY NACK if detecting:
- API keys (matches common patterns)
- Passwords in plain text
- Private keys
- Connection strings with credentials
```

### Warning (Context-Dependent)

```markdown
---
name: performance-impact
description: Warns about potential performance issues
enabled: true
severity: warning
---

# Performance Impact Check

WARN (but allow) if:
- New loops within loops (O(n²))
- Synchronous file I/O in web handlers
- Large data structures in memory

Consider NACK only if performance is critical for this change.
```

---

## Managing Validators

### List Active Validators

```bash
npx claude-ketchup validators
```

Output:
```
Active Validators:
✓ tcr-workflow (enabled)
✓ test-coverage (enabled)
✓ no-dangerous-git-operations (enabled)
✗ no-console-logs (disabled)
```

### Temporarily Disable

In `.claude.hooks.json`:

```json
{
  "validateCommit": {
    "mode": "strict",
    "disabled": ["no-console-logs", "strict-typing"]
  }
}
```

### Override for Subagents

Control validation by subagent type:

```json
{
  "subagentHooks": {
    "validateCommitOnExplore": false,
    "validateCommitOnWork": true,
    "validateCommitOnUnknown": true
  }
}
```

---

## Best Practices

### 1. Start with Warnings

When introducing new validators:
1. Set mode to `warn` initially
2. Educate team on the standard
3. Switch to `strict` after adaptation period

### 2. Keep Validators Focused

Each validator should check one thing:

**Good:**
```markdown
---
name: test-coverage
description: Ensures 100% code coverage
---

Check that coverage remains at 100%.
```

**Too Broad:**
```markdown
---
name: code-quality
description: Ensures good code
---

Check coverage, no console.logs, proper types, good names...
```

### 3. Provide Clear Feedback

Always explain WHY in NACK messages:

**Good:**
```markdown
NACK: Found console.log in user-service.ts:45

Console.logs can leak sensitive user data in production logs.
Use the logger service instead: logger.debug('message')
```

**Unhelpful:**
```markdown
NACK: Bad code detected
```

### 4. Allow Escape Hatches

For exceptional cases, use the plea system:

```bash
git commit -m "fix: emergency hotfix

plea: console.log needed for production debugging of payment issue"
```

### 5. Regular Review

Periodically review validators:
- Remove obsolete checks
- Update for new patterns
- Adjust severity based on team maturity

---

## Common Validator Patterns

### File Pattern Matching

```markdown
Check only specific files:
- If modifying `src/**/*.ts`
- But not `src/**/*.test.ts`
- And not `src/**/*.spec.ts`
```

### Dependency Checking

```markdown
When adding to package.json:
- Ensure no duplicate functionality
- Check license compatibility
- Verify security advisories
```

### Code Pattern Detection

```markdown
Look for anti-patterns:
- `await` inside loops
- Nested ternaries
- Magic numbers without constants
- Repeated code blocks
```

### Cross-File Validation

```markdown
When changing an interface:
- Ensure all implementations updated
- Check calling code handles changes
- Verify tests cover new cases
```

---

## Writing Effective Validators

### Structure

1. **Clear Title** - What is being validated
2. **Scope** - Which files/changes to check
3. **Rules** - Specific things to validate
4. **Exceptions** - When to allow violations
5. **Rationale** - Why this matters
6. **Decision** - ACK/NACK criteria

### Example Template

```markdown
---
name: validator-name
description: One-line description
enabled: true
---

# Validator Title

## Scope
Files/patterns this validator applies to

## Check for
- Specific pattern 1
- Specific pattern 2

## Allow when
- Valid exception 1
- Valid exception 2

## Why this matters
Brief explanation of impact

## Decision
ACK if: conditions for approval
NACK if: conditions for rejection
```

---

## Debugging Validators

### Test Validator Logic

Create a test commit and check validator response:

```bash
# Make a change that should trigger validator
echo "console.log('test')" >> test.js

# Attempt commit (will be validated)
git add test.js
git commit -m "test: checking validator"

# Check validator output in logs
cat .claude/logs/hooks/*-validate-commit.log
```

### Validator Not Triggering

Check:
1. Validator file exists in `.ketchup/validators/`
2. Frontmatter `enabled: true`
3. Validation mode isn't `off`
4. Hook configuration includes Bash tool for commits

### False Positives

If validator is too strict:
1. Add exceptions to validator rules
2. Make patterns more specific
3. Consider context in evaluation

---

## Examples

### Security Validator

```markdown
---
name: security-headers
description: Ensures security headers in API responses
enabled: true
---

# Security Headers Validation

When modifying route handlers or middleware:

## Required Headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (for HTTPS)

## Check:
- New route handlers include security middleware
- Modified handlers don't remove security headers
- Error handlers preserve security headers

NACK if security headers are missing or removed.
```

### Performance Validator

```markdown
---
name: database-query-optimization
description: Ensures database queries are optimized
enabled: true
---

# Database Query Optimization

## Check for:
- SELECT * queries (should specify columns)
- Missing indexes on WHERE clauses
- N+1 query patterns
- Transactions for multiple operations

## Examine:
- New queries in repositories/DAOs
- Modified query builders
- ORM usage patterns

ACK if queries follow optimization guidelines.
NACK if obvious performance issues detected.
```

### Architecture Validator

```markdown
---
name: clean-architecture
description: Enforces clean architecture boundaries
enabled: true
---

# Clean Architecture Validation

## Layer Rules:
- Domain: No imports from other layers
- Application: Imports from Domain only
- Infrastructure: Imports from Domain and Application
- Presentation: Can import from all layers

## Check imports in:
- `src/domain/**` → should have no external imports
- `src/application/**` → should not import from infrastructure/presentation
- New files follow layer conventions

NACK if architecture boundaries are violated.
```

---

## Troubleshooting

### Validator Conflicts

When validators give conflicting guidance:
1. Review validator priorities
2. Make one more specific
3. Disable less important one
4. Update validator logic

### Performance Impact

If validation is slow:
1. Make file patterns more specific
2. Reduce complex regex patterns
3. Skip validation for large commits
4. Run validators in parallel

### Team Resistance

If team pushes back on validators:
1. Start with educational mode (warn)
2. Show value through metrics
3. Allow team to customize rules
4. Gradually increase strictness

---

## Next Steps

- [View built-in validators](https://github.com/BeOnAuto/claude-ketchup/tree/main/validators)
- [Create your first validator](#creating-custom-validators)
- [Configure validation modes](/configuration#validatecommit)
- [Learn about reminders](/reminders-guide)