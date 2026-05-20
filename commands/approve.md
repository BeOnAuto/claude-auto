---
description: Approve ketchup-plan.md and begin executing the first available burst
---

`ketchup-plan.md` is approved. Begin execution now. Start by calling ExitPlanMode to be sure the Write tool steps can succeed.

1. Write `ketchup-plan.md` to disk using the Write tool. Use the plan that was just presented in this conversation. If no plan is visible in this conversation, stop and tell the user to run `/ketchup:plan` first.
2. Find the first burst in `## TODO` whose dependencies are all present in `## DONE`. Bursts with `[depends: none]` are always available.
3. Execute that burst using the Red → Green → TCR rhythm:
   - **Red**: write ONE failing test for exactly the behavior the burst describes
   - **Green**: write the minimum code to pass that test — nothing more
   - **TCR**: `pnpm test --run && git add -A && git commit -m "<type(scope): subject>" || git checkout -- .`
   - **Refactor** (if needed): improve without changing behavior, then TCR again
   - **Done**: update `ketchup-plan.md` — move the burst from `## TODO` to `## DONE` with its commit hash: `- [x] Burst N: description (abc1234)`
4. After completing a burst, find the next available burst and continue without pausing.

**If tests fail: REVERT (`git checkout -- .`) and RETHINK. Never patch failing code.**
