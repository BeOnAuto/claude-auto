# The Origin Story: From Janitor to Architect

> How one developer stopped cleaning up after AI

---

## The Janitor Phase

Ask Claude to write a script that posts something online. You get the script, a README you didn't need, helper functions for edge cases that don't exist, and maybe a logging framework.

Ask for "Hello World" and receive a nav bar, login system, and comment section.

**I was spending more time cleaning up than building.**

AI doesn't get tired. It over-executes. And I was the janitor, sweeping up after every session.

Claude Code would hallucinate features nobody asked for, add defensive code paths that would never run, and build enterprise architecture for throwaway scripts.

I wanted precision. Something that could use the machine's output without drowning in it.

---

## The Search for Discipline

### Extreme Programming Roots

My background is in Extreme Programming: Test-Driven Development, pair programming, continuous integration, extreme ownership. These weren't just practices. They were a philosophy about how software should grow.

The key insight from TDD: if it's hard to test, the design is wrong. Code flows naturally when the design is right. When you're fighting the tests, you're fighting a smell.

### TCR

In 2019, I read [Kent Beck's article](https://medium.com/@kentbeck_7670/test-commit-revert-870bbd756864) on TCR (Test && Commit || Revert). The rule: run your tests, and if they pass, commit automatically. If they fail, revert everything. No debugging. No patching. Start fresh.

What if I put this in a loop with AI? The thought experiment about infinite monkeys with typewriters producing Shakespeare, but with tests as the filter. A million AIs, and the ones that work are the ones that meet the tests.

The revert isn't a problem. It's a tool.

---

## The Birth of Ketchup

### Why "Ketchup"?

The name has two meanings:

**Controlled dispensing.** Pour ketchup from a glass bottle: bang and bang and nothing comes out, then suddenly the whole bottle empties onto your plate. AI overachievement is the same. You need the right amount. The technique is like those special bottles with controlled dispensers.

**Fresh nomenclature.** When you tell an LLM to create a "user story" or "epic" or "sprint," you invoke terms trained on billions of articles. The model hallucinates toward patterns it's seen before: Jira tickets, agile ceremonies, estimation theater.

I needed vocabulary that was unpolluted.

### Bottles and Bursts

Hence: **Bottles** and **Bursts**.

A **Burst** is one test, one behavior, one commit. Atomic, independent, valuable. The constraint is scope, not time.

A **Bottle** groups related bursts. Name it by capability, not sequence number.

These terms have no baggage. No billions of parameters pulling them toward someone else's interpretation of what a "sprint" should contain or how a "story" should be sized. The LLM encounters them fresh.

---

## The Core Insight

### Never Patch, Always Revert

Here's what Claude does when something breaks: Debug. Find the broken variable. Fix it. Now something else breaks. Fix that. The wiring's wrong. Fix the wiring. Keep going, keep patching, keep assuming the original design was correct.

Developers do this too. It's human nature to protect sunk costs.

But I recognized the pattern from TDD practice: when code isn't flowing smoothly into place, the design is usually wrong. You're not debugging a mistake. You're polishing a flawed foundation.

The Ketchup Technique enforces reversion. When tests fail, don't patch. Revert. The code disappears.

But the learning stays in the context window.

The LLM still has all the context of why it failed. It's not forgetting the lesson. It has a clean slate to apply that lesson differently. It has space to think.

The result is **emergent design**. Individual ants follow simple rules but colonies exhibit complex behavior. The Ketchup Technique produces architecture through simple, repeated cycles.

Each burst is an ant. The system that emerges is something none of the individual bursts planned.

### 100% Coverage for Free

The 100% code coverage requirement sounds extreme. It would be extreme for humans: tedious, time-consuming, often impractical.

But with true TDD, 100% coverage should be free.

If you're genuinely driving every piece of your system with a test first, nothing should be uncovered. An uncovered line means you wrote code that wasn't demanded by a test. That's a smell.

The coverage requirement isn't extra work. It's a check that the discipline is being followed.

---

## The Transformation

What changed wasn't the AI. It was my role.

**Before:** I reviewed AI's work, caught problems, fixed them, reviewed again.

**After:** I define requirements. The system executes. I review clean increments.

The hooks enforce what I used to do manually:

- Validate commits against rules (supervisor)
- Block access to sensitive files (deny-list)
- Inject context at session start (skills)
- Continue or stop intelligently (auto-continue)

**I stopped being the janitor. I became the architect.**

---

## The Quality Stack

Through refinement, five components emerged:

| Component                 | What It Does                                |
| ------------------------- | ------------------------------------------- |
| **Auto-Planning**         | AI plans in `ketchup-plan.md` before coding |
| **Parallel Execution**    | Sub-agents work on independent bursts       |
| **Supervisor Validation** | Every commit is ACK'd or NACK'd             |
| **Auto-Continue**         | AI keeps working until plan is complete     |
| **TCR Discipline**        | Tests pass or code reverts                  |

Together: **Speed, Quality, AND Control.**

---

## Battle-Tested

I built over ten features using the technique. Nursing it along, automating more of what needed nursing, refining the hooks, tuning the behaviors.

It took time to get here. I'd notice a place where Claude was misbehaving and think, "Can I automate a fix for that?" Usually I could. A new hook, a new validation, a new skill.

Each problem became a feature.

The technique evolved to be collaborative. Team members can contribute without understanding every detail, because the hooks enforce the discipline automatically.

---

## Your Turn

You don't have to be the janitor.

**[Start your transformation →](/getting-started)**

---
