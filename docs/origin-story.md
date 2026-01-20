# The Ketchup Technique: Origin Story

> How controlled AI execution produces emergent design

---

## The Problem

Ask Claude to write a script that posts something online. You get a script, a README, helper functions you didn't need, and maybe a logging framework. Ask for a webpage that says "Hello World" and you receive a nav bar, login functionality, and a comment system.

AI doesn't get tired. It over-executes.

Claude Code would hallucinate features nobody asked for, add defensive code paths that would never run, and build enterprise architecture for throwaway scripts.

I wanted precision. Something that could use the machine's output without drowning in it.

---

## The Foundations

### Extreme Programming Roots

My background is in Extreme Programming: Test-Driven Development, pair programming, continuous integration, extreme ownership. These weren't just practices. They were a philosophy about how software should grow.

The key insight from TDD: if it's hard to test, the design is wrong. Code flows naturally when the design is right. When you're fighting the tests, you're fighting a smell.

### TCR

In 2021, I read Kent Beck's article on TCR (Test && Commit || Revert). The rule: run your tests, and if they pass, commit automatically. If they fail, revert everything. No debugging. No patching. Start fresh.

What if I put this in a loop with AI? The thought experiment about infinite monkeys with typewriters producing Shakespeare, but with tests as the filter. A million AIs, and the ones that work are the ones that meet the tests.

The revert isn't a problem. It's a tool.

---

## The Birth of Ketchup

### Why Not Pomodoro?

The first version was called "The Pomodoro Technique for AI." Time-boxed intervals, focused work, regular breaks. After a conversation with Francesco Cirillo, the creator of the Pomodoro Technique, I decided the approach needed its own identity.

The Pomodoro Technique is for humans. But machines don't get tired. They get lost. Twenty-five minute intervals make sense for human fatigue. For AI, we need something different.

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

## The Evolution

### From Markdown to Hooks

The first implementation was just a CLAUDE.md file. Instructions the AI would read and (theoretically) follow. It worked, sometimes. But it wasn't enforced.

I noticed other approaches emerging. The "Ralph Loop" technique (infinite continue until done). Claude's planning mode capabilities. Various hook systems for intercepting AI behavior.

I started pairing all of that with the Ketchup principles. The hook system was the key. I could enforce the rules, not just suggest them.

The important realization: Bottles and Bursts enable parallelization. If bursts are truly independent, multiple sub-agents can work simultaneously, each following the same hooks, each held to the same TCR discipline.

### Battle Testing

I built over ten features for Auto using the technique. Nursing it along, automating more of what needed nursing, refining the hooks, tuning the behaviors.

It took time to get here. I'd notice a place where Claude was misbehaving and think, "Can I automate a fix for that?" Usually I could. A new hook, a new validation, a new skill.

The technique evolved to be collaborative. Team members can contribute without understanding every detail, because the hooks enforce the discipline automatically. And it coexists with existing project configurations. It just adds its layer of structure.

---

## How It Works

### The Loop

```
Red → Green → TCR → Refactor → TCR → Done
```

Write a failing test. Write minimal code to pass it. Run TCR: if tests pass, commit; if they fail, revert. Refactor if needed, TCR again. Move to the next burst.

One test. One behavior. One commit. No exceptions.

### The Philosophy

Don't dump the whole bottle on your plate. Dispense it in controlled bursts.

```
BURST → COMMIT → BURST → COMMIT
```

Each burst is small enough that:

- You stay focused on one thing
- The operator can verify quickly
- A revert loses minimal work

The AI doesn't plan ahead. It doesn't architect. It follows the tests, one burst at a time, and the design emerges.

---

## Using the Technique

1. **Prepare a `ketchup-plan.md`** with TODO and DONE sections, organized into Bottles
2. **Put Claude in planning mode** to analyze requirements
3. **Execute one burst at a time** with TCR discipline
4. **Let the hooks enforce the rules** automatically

The hooks validate commits, inject context at session start, protect files from modification, and keep the AI focused on the current burst.

---

## The Result

The Ketchup Technique produces code that:

- Has 100% test coverage by construction
- Features emergent design rather than upfront architecture
- Can be verified burst by burst
- Maintains context across reverts
- Parallelizes across sub-agents

It uses AI's output without being overwhelmed by it. The machine's energy gets channeled through a controlled dispenser, one burst at a time.

---

_Disclaimer on the writing of this story: I used Claude to "interview me" and then write this for me. I use AI to save time, but I curate and tweak the responses a lot._

_Note on Inspiration: The Ketchup Technique is an independent methodology built for AI-native development cycles. While it acknowledges the foundation of time-boxed, focused intervals found in the Pomodoro Technique (a registered trademark of Francesco Cirillo), it is a separate method with different mechanics and goals. Learn more about the original human-focused technique at [pomodorotechnique.com](http://pomodorotechnique.com/)._
