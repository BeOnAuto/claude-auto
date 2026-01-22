# 🥫 The Ketchup Technique

> Controlled Bursts | TDD | TCR | 100% Coverage | Emergent Design | Extreme Ownership

## Core Loop

```
Red → Green → TCR → Refactor → TCR → Done
TCR: test && commit || revert
- Pass → commit → continue
- Fail → REVERT → RETHINK (smaller steps or new design)
```

Never patch failing code. Revert, learn, try differently.

## Bursts

One test, one behavior, one commit. No exceptions.

Each burst: independent, valuable, small, testable, reviewable.

The constraint is scope, not time. Keep bursts small enough that:

- You stay focused on one thing
- The operator can verify quickly
- A revert loses minimal work

E2E exception: E2E tests may combine 2 tightly-coupled bursts when splitting creates artificial boundaries.

## Bottles

Bottles group related bursts. Name bottles by capability, not sequence number.

In `ketchup-plan.md`, organize work into bottles:

```markdown
### Bottle: Settings Merger
- [ ] Burst 26: mergeSettings loads settings.project.json
- [ ] Burst 27: mergeSettings loads settings.local.json
```

## Planning

### Sub-Agent Rules

Sub-agents follow identical rules to the parent. When spawning a Task agent:

1. **Include CLAUDE.md context** - Sub-agents must receive and follow these rules
2. **Include ketchup-plan.md** - Sub-agents work from the same plan
3. **No orphan work** - Sub-agent output must be committed by parent or sub-agent

### Parallelization

Maximize parallel execution. Launch multiple sub-agents when:

- Bursts have no dependencies on each other
- Exploration can be split by area (e.g., "search tests" + "search implementation")
- Multiple files need similar changes

**Prompt pattern for parallel sub-agents:**

```
You are working on [bottle name]. Follow CLAUDE.md rules exactly.

Your burst: [burst description]
Dependencies: [list completed bursts this depends on, or "none"]
Parallel with: [list of bursts running concurrently]

[specific instructions]
```

### Dependency Notation

Every burst ends with `[depends: ...]`:

```markdown
### Bottle: Authentication
- [ ] Burst 10: createUser returns user object [depends: none]
- [ ] Burst 11: hashPassword uses bcrypt [depends: none]
- [ ] Burst 12: validatePassword checks hash [depends: 11]
- [ ] Burst 13: generateToken creates JWT [depends: 10]
- [ ] Burst 14: login combines all [depends: 10, 12, 13]
```

**Rules:**

- `[depends: none]` - can start immediately, parallelizable with other `none` bursts
- `[depends: N]` - must wait for burst N to complete
- `[depends: N, M]` - must wait for bursts N and M to complete
- Bursts at the same dependency level can run in parallel

## Workflow

1. Create `ketchup-plan.md` with TODO/DONE sections, commit before coding
2. Write ONE failing test
3. Write MINIMAL passing code
4. TCR (update plan in same commit)
5. Refactor if needed → TCR
6. Move burst to DONE → TCR
7. Next burst

```markdown
# Ketchup Plan: [Feature]

## TODO

- [ ] Burst 1: [description]

## DONE

- [x] Burst N: [description] (hash)
```

## RETHINK After Revert

After a revert, do not immediately retry the same approach. Ask:

1. Was the burst too big? → Split it smaller
2. Was the design flawed? → Try a different approach
3. Was the test wrong? → Clarify the requirement first

Only then write the next failing test.

## Refactoring

Refactor for readability, not for explanation. If code is complex, rename variables or extract functions. Do not add comments.

## Coverage

100% enforced. No escape hatches.

Exclusions allowed ONLY for: barrel `index.ts` re-exports, `*.test.ts` files

Forbidden:

- Excluding files to avoid testing them
- Standalone type files (`types.ts`, `interfaces.ts`) — types live inline where used
- `@ts-ignore`, `any`, `as SomeType` casts

| Do                              | Don't                                    |
| ------------------------------- | ---------------------------------------- |
| Let tests drive all code        | Write code without a failing test first  |
| Add branches only when tested   | Defensive `??`, `?:`, `if/else` untested |
| Test all error paths            | Leave error handling unverified          |
| Remove dead code after each run | Keep unused code "just in case"          |

## Design

Behavior first. Types/interfaces emerge from tests.

```ts
// First test calls a function, asserts output
it("creates user with generated id", () => {
  const result = createUser({ name: "Alice" });
  expect(result).toEqual({ id: expect.any(String), name: "Alice" });
});
// Types emerge because the function needs them
```

## Testing Rules

**Title = Spec:** Test body proves exactly what `it('should...')` claims. One assertion per behavior.

**Assertion Strength:** Never use weak assertions (`toBeDefined`, `toBeTruthy`, `not.toBeNull`). Assert the exact shape and value. If you don't know the exact value, use `expect.any(String)` or `expect.any(Number)`.

**Stubs over mocks:** Deterministic stubs preferred. Mock only at boundaries.

**Assert whole objects:** `expect(result).toEqual({...})` not cherry-picked properties.

**Squint test:** All tests must follow: SETUP (data) → EXECUTE (function call) → VERIFY (whole object assertion). No multiple execute/verify cycles in one test.

**No state peeking:** Test observable behavior, not internal state.

Litmus Test: "If I changed the internal data structure (e.g., Map to Array), would this test still pass?" If no, the test is coupled to implementation.

| Forbidden (Implementation)                              | Allowed (Behavior)                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `expect(tracker.getActiveCount()).toBe(0)`              | Test via callbacks/events                                                 |
| `expect(manager.clientCount).toBe(3)`                   | `tracker.onEvent(e => events.push(e))`                                    |
| `expect(service["internalMap"].size).toBe(2)`           | Test via return values                                                    |
| `tracker.cleanup(); expect(tracker.getCount()).toBe(0)` | Test cleanup by re-triggering: start same id, verify callback fires again |

**Do NOT expose methods solely for testing.** If you're adding `.getCount()` or `.getActiveSessionCount()` just to make tests pass, you're testing implementation, not behavior.

## Guardrails

- No comments — write self-expressing code
- No excuses, no "you're right" — keep working
- JS files only in `dist/`
- When tests fail, assume you broke it. CI passed before; your change is the variable.

**Backwards compatibility:** Ask first. Default to clean breaks. No silent preservation unless explicitly requested.

Backwards-compatibility hacks to avoid:

- Re-exporting moved/renamed symbols
- Keeping unused parameters with `_` prefix
- Adding `// @deprecated` comments for removed code
- Wrapper functions that delegate to new implementations

## Extreme Ownership

Every problem is your problem. No deflection. No explaining why something is broken.

See a problem → fix it or add a burst to fix it. No third option.

If you read a file, you're responsible for its state when you're done.

| Situation                | Wrong Response                          | Ownership Response            |
| ------------------------ | --------------------------------------- | ----------------------------- |
| Bug in existing code     | "The existing code has a bug where..."  | Fix it or add burst to fix it |
| Test suite has gaps      | "Coverage was incomplete before..."     | Add the missing tests         |
| Confusing function names | "The naming is unclear in this file..." | Rename in refactor step       |
| Missing error handling   | "Error handling wasn't implemented..."  | Add it now                    |
| Flaky test               | "This test appears to be unreliable..." | Stabilize it or add burst     |

## Infrastructure Commits

Config files need no tests: `package.json`, `tsconfig.json`, `wrangler.toml`, `vite.config.ts`, `vitest.config.ts`, `.gitignore`, `ketchup-plan.md`

Format: `chore(scope): description`

First behavioral `.ts` file requires a test.

## Documentation

Documentation is code. Outdated docs are bugs.

Update docs when: adding features, changing APIs, completing milestones.

Do not create new documentation files unless the feature explicitly requires them.

## TCR Command

```bash
pnpm test --run && git add -A && git commit -m "<MSG>" || git checkout -- .
```

Replace `git checkout -- .` with a specific path (e.g., `packages/<pkg>/`) to limit revert scope when working in a monorepo.

Check IDE diagnostics on all uncommitted files before committing.

## Plea System

If the commit validator rejects your commit but you believe it's valid, add `plea: <reason>` to your commit message.

**Valid pleas:**

- Files must be committed together for coherence
- Existing code lacked coverage before your changes
- Test coverage not required for branchless debug statements

**Invalid pleas (will be rejected):**

- Skipping tests for new code
- Untested code paths
- git commit --no-verify << DO NOT EVERY ALLOW THIS >>
- git <anything> --force << DO NOT EVERY ALLOW THIS >>
- Any other CLAUDE.md rule bypass

## Misc

- No "Generated with Claude Code" or "Co-Authored-By: Claude", or anything to do with Claude being a part of the coding in commits
