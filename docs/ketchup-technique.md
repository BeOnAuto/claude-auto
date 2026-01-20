# The Quality Stack

> Speed, Quality, AND Control

---

## The Old Tradeoff

Pick two:

- Fast AI execution → Quality suffers, control lost
- High quality code → Slow, micromanagement required
- Tight control → Bottleneck, defeats AI purpose

**The Quality Stack breaks this tradeoff. You get all three.**

---

## The Five Components

### 1. Auto-Planning

Before code, there's a plan.

```markdown
# ketchup-plan.md

## TODO

- [ ] Burst 1: createUser returns user object [depends: none]
- [ ] Burst 2: hashPassword uses bcrypt [depends: none]
- [ ] Burst 3: validatePassword checks hash [depends: 2]

## DONE

- [x] Burst 0: Project setup (abc123)
```

**What it means for you:** AI thinks before it acts. You approve the plan, not the chaos.

### 2. Parallel Execution

Independent bursts run simultaneously.

```
[Burst 1] ─────► commit
[Burst 2] ─────► commit     (parallel)
[Burst 3] ───────────────► commit (waits for 2)
```

**What it means for you:** Speed without sacrificing quality. Sub-agents follow the same rules.

### 3. Supervisor Validation

Every commit faces the validator.

```
Claude attempts commit
        │
        ▼
┌───────────────────┐
│  Supervisor Hook  │
│  Checks:          │
│  - Test coverage  │
│  - CLAUDE.md rules│
│  - Deny-list      │
└────────┬──────────┘
         │
    ┌────┴────┐
    ▼         ▼
  ACK       NACK
  Commit    Revert
  lands     & rethink
```

**What it means for you:** Bad code never lands. The supervisor catches it.

### 4. Auto-Continue

AI doesn't stop until the plan is complete.

```
Burst completes
     │
     ▼
┌───────────────────┐
│  Stop Hook fires  │
│  Checks:          │
│  - ketchup-plan.md│
│  - Unchecked TODOs│
└────────┬──────────┘
         │
    ┌────┴────┐
    ▼         ▼
  CONTINUE   STOP
  More work  Plan
  remains    complete
```

**What it means for you:** No babysitting. Define the plan, walk away, review results.

### 5. TCR Discipline

Test && Commit || Revert. No middle ground.

```
Red → Green → TCR → Refactor → TCR → Done
```

- Tests pass → Commit automatically
- Tests fail → Revert completely
- Never patch failing code

**What it means for you:** Every commit is proven working. No "fix the fix" commits.

---

## The Core Loop

One test. One behavior. One commit.

Each **Burst** is atomic:

- Independent (can run in parallel if no dependencies)
- Valuable (delivers observable behavior)
- Small (easy to review, safe to revert)
- Testable (100% coverage by construction)

**Bottles** group related bursts by capability, not sequence number.

```markdown
### Bottle: Settings Merger

- [ ] Burst 26: mergeSettings loads settings.project.json
- [ ] Burst 27: mergeSettings loads settings.local.json
```

---

## Why It Works

### Emergent Design

Individual ants follow simple rules. Colonies exhibit complex behavior.

The Quality Stack works the same way:

- Each burst follows simple rules (red/green/TCR)
- Architecture emerges from passing tests
- No upfront design that AI will ignore anyway

### Context Preservation Across Reverts

When TCR reverts code, the learning stays:

- Claude remembers what failed
- It has a clean slate to try differently
- The context window contains the lesson

Reverts aren't punishment. They're information.

### 100% Coverage by Construction

If code exists, a test demanded it.

This isn't enforced through willpower. It's structural:

- Write test first (red)
- Write minimal code to pass (green)
- No code without a test

Uncovered code = code nobody asked for = deleted by next revert.

---

## Planning Rules

### Sub-Agent Rules

Sub-agents follow identical rules to the parent. When spawning a Task agent:

1. **Include CLAUDE.md context** - Sub-agents must receive and follow these rules
2. **Include ketchup-plan.md** - Sub-agents work from the same plan
3. **No orphan work** - Sub-agent output must be committed by parent or sub-agent

### Parallelization

Maximize parallel execution. Launch multiple sub-agents when:

- Bursts have no dependencies on each other
- Exploration can be split by area
- Multiple files need similar changes

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

- `[depends: none]` - can start immediately, parallelizable
- `[depends: N]` - must wait for burst N to complete
- `[depends: N, M]` - must wait for bursts N and M to complete

---

## Workflow

1. Create `ketchup-plan.md` with TODO/DONE sections, commit before coding
2. Write ONE failing test
3. Write MINIMAL passing code
4. TCR (update plan in same commit)
5. Refactor if needed → TCR
6. Move burst to DONE → TCR
7. Next burst

### RETHINK After Revert

After a revert, do not immediately retry the same approach. Ask:

1. Was the burst too big? → Split it smaller
2. Was the design flawed? → Try a different approach
3. Was the test wrong? → Clarify the requirement first

Only then write the next failing test.

---

## Testing Rules

**Title = Spec:** Test body proves exactly what `it('should...')` claims. One assertion per behavior.

**Assertion Strength:** Never use weak assertions (`toBeDefined`, `toBeTruthy`, `not.toBeNull`). Assert the exact shape and value.

**Stubs over mocks:** Deterministic stubs preferred. Mock only at boundaries.

**Assert whole objects:** `expect(result).toEqual({...})` not cherry-picked properties.

**Squint test:** All tests must follow: SETUP → EXECUTE → VERIFY. No multiple execute/verify cycles.

**No state peeking:** Test observable behavior, not internal state.

| Forbidden (Implementation)                    | Allowed (Behavior)         |
| --------------------------------------------- | -------------------------- |
| `expect(tracker.getActiveCount()).toBe(0)`    | Test via callbacks/events  |
| `expect(manager.clientCount).toBe(3)`         | Test via return values     |
| `expect(service["internalMap"].size).toBe(2)` | Test via observable output |

---

## Coverage

100% enforced. No escape hatches.

Exclusions allowed ONLY for: barrel `index.ts` re-exports, `*.test.ts` files

| Do                              | Don't                                    |
| ------------------------------- | ---------------------------------------- |
| Let tests drive all code        | Write code without a failing test first  |
| Add branches only when tested   | Defensive `??`, `?:`, `if/else` untested |
| Test all error paths            | Leave error handling unverified          |
| Remove dead code after each run | Keep unused code "just in case"          |

---

## Design

Behavior first. Types/interfaces emerge from tests.

```ts
it("creates user with generated id", () => {
  const result = createUser({ name: "Alice" });
  expect(result).toEqual({ id: expect.any(String), name: "Alice" });
});
```

---

## Guardrails

- No comments — write self-expressing code
- JS files only in `dist/`
- When tests fail, assume you broke it

**Backwards compatibility:** Ask first. Default to clean breaks.

---

## Extreme Ownership

Every problem is your problem. No deflection.

See a problem → fix it or add a burst to fix it. No third option.

| Situation                | Wrong Response                         | Ownership Response            |
| ------------------------ | -------------------------------------- | ----------------------------- |
| Bug in existing code     | "The existing code has a bug where..." | Fix it or add burst to fix it |
| Test suite has gaps      | "Coverage was incomplete before..."    | Add the missing tests         |
| Confusing function names | "The naming is unclear..."             | Rename in refactor step       |

---

## Infrastructure Commits

Config files need no tests: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `ketchup-plan.md`

Format: `chore(scope): description`

---

## TCR Command

```bash
pnpm test --run && git add -A && git commit -m "<MSG>" || git checkout -- .
```

---

## The Transformation

| Before (AI Janitor)          | After (System Architect)        |
| ---------------------------- | ------------------------------- |
| Review massive PRs           | Review single-behavior commits  |
| "Let me fix this..." spirals | System reverts, rethinks        |
| Chase coverage gaps          | 100% by construction            |
| Fight AI's architecture      | Architecture emerges from tests |
| Clean up hallucinations      | Supervisor blocks bad commits   |

**[Get started →](/getting-started)**
