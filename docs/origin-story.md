# The Origin Story: From Babysitter to Bionic

> How I stopped supervising AI and started parallelizing

---

## The Babysitter Phase

I was stuck in a loop.

Every Claude session demanded my full attention. Watching for drift. Nudging it back on track. Correcting hallucinations in real-time.

I couldn't walk away. I couldn't context-switch. I couldn't parallelize.

AI-assisted coding had captured my cognitive load.

I adopted AI to multiply my output. Instead, I was doing one thing at a time with help that required constant supervision.

That's not multiplication. That's marginally faster serial work.

---

## The Search for Trust

### The Problem Wasn't Speed

The bottleneck wasn't AI's speed. It was my attention.

You can only parallelize if you trust the execution. I didn't trust Claude to execute correctly without me watching. So I watched. One task. Full attention. Forever.

I needed a system I could trust.

### Extreme Programming Roots

My background is in Extreme Programming: Test-Driven Development, pair programming, continuous integration, extreme ownership. These weren't just practices. They were a philosophy about how software should grow.

The key insight from TDD: if it's hard to test, the design is wrong. Code flows naturally when the design is right. When you're fighting the tests, you're fighting a smell.

### TCR

In 2019, I read [Kent Beck's article](https://medium.com/@kentbeck_7670/test-commit-revert-870bbd756864) on TCR (Test && Commit || Revert). The rule: run your tests, and if they pass, commit automatically. If they fail, revert everything. No debugging. No patching. Start fresh.

What if I put this in a loop with AI? The thought experiment about infinite monkeys with typewriters producing Shakespeare, but with tests as the filter. A million AIs, and the ones that work are the ones that meet the tests.

The revert isn't a problem. It's a tool.

---

## The Birth of the Quality Loop

### Three Layers: Methodology, System, and Tool

The internet is polluted with PM vocabulary. Epics, sprints, stories, SAFe — the LLM training data is saturated with these terms. When you tell an AI to plan work using established agile terminology, it hallucinates toward Jira tickets, estimation theater, and ceremony-heavy processes it's seen a billion times.

I needed fresh vocabulary. Unpolluted terms that wouldn't trigger pattern-matching toward someone else's methodology.

That's how **The Ketchup Technique** was born — a play on "catch up." Like the Pomodoro Technique gave fresh vocabulary for time management (a tomato timer instead of "timeboxing"), the Ketchup Technique gives fresh vocabulary for AI-assisted planning. It is the *methodology*: Bottles, Bursts, dependencies, and `ketchup-plan.md`.

But a methodology is just theory until it runs. Through refinement, the methodology crystallized into **the Quality Loop** — a four-component validation *system*: Auto-Planner, Supervisor AI, TCR Discipline, and Auto-Continue. The Quality Loop is what creates the trust that lets you walk away.

Enter **Claude Auto** — the open-source *tool* that implements both. It's the hooks, the validators, the auto-continue system, the reminders. The machinery that turns methodology into execution.

Claude Auto is the first step to putting your entire development workflow **on.Auto**.

### Bottles and Bursts

The Ketchup Technique introduces: **Bottles** and **Bursts**.

A **Burst** is one test, one behavior, one commit. Atomic, independent, valuable. The constraint is scope, not time.

A **Bottle** groups related bursts. Name it by capability, not sequence number.

These terms have no baggage. No billions of parameters pulling them toward someone else's interpretation.

---

## The Core Insight: Never Patch, Always Revert

Here's what Claude does when something breaks: Debug. Find the broken variable. Fix it. Now something else breaks. Fix that. The wiring's wrong. Fix the wiring. Keep going, keep patching, keep assuming the original design was correct.

Developers do this too. It's human nature to protect sunk costs.

But I recognized the pattern from TDD practice: when code isn't flowing smoothly into place, the design is usually wrong. You're not debugging a mistake. You're polishing a flawed foundation.

The Quality Loop enforces reversion. When tests fail, don't patch. Revert. The code disappears.

But the learning stays in the context window.

The LLM still has all the context of why it failed. It's not forgetting the lesson. It has a clean slate to apply that lesson differently. It has space to think.

The result is **emergent design**. Individual ants follow simple rules but colonies exhibit complex behavior. The Quality Loop produces architecture through simple, repeated cycles.

Each burst is an ant. The system that emerges is something none of the individual bursts planned.

---

## The Transformation

What changed wasn't the AI. It was my role.

**Before:** Watch AI's work, catch problems, nudge corrections, watch more.

**After:** Define requirements. The system executes. Walk away. Review clean increments.

The hooks enforce what I used to do manually:

- Validate commits against rules (supervisor)
- Block access to sensitive files (deny-list)
- Inject context at session start (skills)
- Continue or stop intelligently (auto-continue)

I stopped being the babysitter. I became Bionic.

---

## The Multiplier: Git Worktrees

Then I discovered the real leverage.

Git worktrees let you have multiple working directories from the same repo. Each on a different branch. Each isolated.

Set Claude Auto off on Feature A in worktree-1.
Open worktree-2. Set Claude Auto off on Feature B.
Open worktree-3. Set Claude Auto off on Feature C.

Three features running simultaneously. All quality-validated.

Not doing one thing faster. Doing many things at once.

The on.auto team ships 5-10 features per week. Not 1-2.

---

## The Quality Loop

Through refinement, four components emerged:

| Component          | What It Does                               | Result                          |
| ------------------ | ------------------------------------------ | ------------------------------- |
| **Auto-Planner**   | Generates plan from your requirements      | No need to specify every detail |
| **Supervisor AI**  | Validates every commit against your criteria | Automated review               |
| **TCR Discipline** | Test && Commit \|\| Revert                 | Bad code auto-reverts           |
| **Auto-Continue**  | Keeps going until the plan is done         | No nudging required             |

Together: Trust that enables parallelization.

---

## 100% Coverage for Free

The 100% code coverage requirement sounds extreme. It would be extreme for humans: tedious, time-consuming, often impractical.

But with true TDD, 100% coverage should be free.

If you're genuinely driving every piece of your system with a test first, nothing should be uncovered. An uncovered line means you wrote code that wasn't demanded by a test. That's a smell.

The coverage requirement isn't extra work. It's a check that the discipline is being followed.

---

## Battle-Tested

I built over ten features using the technique. Nursing it along, automating more of what needed nursing, refining the hooks, tuning the behaviors.

It took time to get here. I'd notice a place where Claude was misbehaving and think, "Can I automate a fix for that?" Usually I could. A new hook, a new validation, a new skill.

Each problem became a feature.

The technique evolved to be collaborative. Team members can contribute without understanding every detail, because the hooks enforce the discipline automatically.

---

## Your Turn

You don't have to be the babysitter.

| Before (Babysitter)              | After (Bionic)                 |
| -------------------------------- | ------------------------------ |
| Watching one AI session          | Directing multiple workstreams |
| Nudging, correcting in real-time | Defining, approving, releasing |
| Serial productivity              | Parallel productivity          |
| Marginal gains (1.5x)            | Multiplicative gains (5-10x)   |
| Brain captured by supervision    | Brain freed for the next thing |

From Babysitter to Bionic.

**[Get Started →](/getting-started)**

---
