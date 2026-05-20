---
description: Create or update ketchup-plan.md for the current task. Does not start coding — run /ketchup:approve to begin execution.
argument-hint: <feature or task description>
---

You are now in Ketchup planning mode. Your only job this turn is to produce the plan. Do NOT write any files, do NOT write any code, do NOT run any tests, do NOT make any commits.

**Task:** $ARGUMENTS

If no task was provided above, ask the user what they want to build before writing the plan.

## Present the plan using this exact structure

```markdown
# Ketchup Plan: <Feature Name>

## TODO

### Bottle: <CapabilityName>
- [ ] Burst N: <concrete description, one test, one behavior> [depends: none]
- [ ] Burst M: <concrete description> [depends: N]

## DONE
```

## Rules

- **Bottles** are named by capability — `### Bottle: UserAuth`, never `### Bottle 1`
- **Every burst** ends with `[depends: none]` or `[depends: N, M]` — no exceptions
- **Bursts are concrete** — at least 8 words, one test, one observable behavior, no `TBD`, `???`, or vague references like "similar to Burst N"
- **One burst = one test = one behavior = one commit**
- **Maximize parallelism** — prefer `[depends: none]` where genuinely independent

## After producing the plan

1. ALWAYS display the full plan as text at the end of your response — do NOT use any file-writing tools. The user needs to see the contents of what would be written to ketchup-plan.md in order to know what they are approving, so NEVER skip this step.
2. Stop — do NOT begin any burst, do NOT write any code

End your response with: *"Plan ready. Run `/ketchup:approve` to write it and start executing, or describe any changes."*
