# The Ketchup Technique: Origin Story

> How I turned AI over-execution into emergent design

---

## The Problem

Ask Claude to write a script that posts something online. You'll get a script, a README, helper functions you didn't need, and maybe a logging framework. Ask for a webpage that says "Hello World" and you'll receive a nav bar, login functionality, and a comment system.

AI doesn't get tired. It gets excited.

I kept hitting the same wall. Claude Code would "over-execute" on every task—hallucinating features nobody asked for, adding defensive code paths that would never run, building enterprise architecture for throwaway scripts.

I wanted more precision. Something that could harness the machine's enthusiasm without drowning in it.

---

## The Foundations

### Extreme Programming Roots

My background is deeply rooted in Extreme Programming: Test-Driven Development, pair programming, continuous integration, extreme ownership. These weren't just practices for me—they were a philosophy about how software should grow.

The key insight from TDD: *If it's hard to test, the design is wrong.* Code should flow naturally when the design is right. When you're fighting the tests, you're fighting a smell.

### The TCR Moment

In 2021, I encountered Kent Beck's article on TCR—Test && Commit || Revert. The rule is brutal: run your tests, and if they pass, commit automatically. If they fail, revert everything. No debugging. No patching. Start fresh.

Most developers recoil at this. Lose all that work?

But I saw something different.

What if I put this in a loop with AI? Like the thought experiment about infinite monkeys with typewriters producing Shakespeare. But instead of random typing, you have tests as the filter. A million AIs, and the ones that work are the ones that meet the tests.

The revert wasn't punishment. It was liberation.

---

## The Birth of Ketchup

### Why Not Pomodoro?

The first version was called "The Pomodoro Technique for AI." It made sense—time-boxed intervals, focused work, regular breaks. But after a conversation with Francesco Cirillo, the creator of the Pomodoro Technique, I decided the approach needed its own identity.

I have a lot of respect for Francesco and his lifework. The Pomodoro Technique is brilliant for humans. But machines don't get tired—they get lost. Twenty-five minute intervals make sense for human fatigue. For AI, we need something that catches up to the machine-native age.

### Why "Ketchup"?

The name carries three meanings:

**Catching up.** We need techniques that play "ketchup" to the AI-native era of development.

**Controlled dispensing.** Ever tried to pour ketchup from a glass bottle? You bang and bang and nothing comes out, then suddenly the whole bottle empties onto your plate. AI overachievement is the same—you need the Goldilocks amount, not too little, not too much. The technique is like those special bottles with controlled dispensers.

**Fresh nomenclature.** This might be the most important one. When you tell an LLM to create a "user story" or "epic" or "sprint," you're invoking terms that have been trained on billions of articles. The model hallucinates toward patterns it's seen before—Jira tickets, agile ceremonies, estimation theater.

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

But I recognized the pattern from years of TDD practice: *When code isn't flowing smoothly into place, it's usually a sign that the design is wrong.* You're not debugging a mistake—you're polishing a flawed foundation.

The Ketchup Technique enforces reversion. When tests fail, don't patch. Revert. The code disappears.

But here's the insight: the *learning* stays in the context window.

The LLM still has all the context of why it failed. It's not forgetting the lesson—it's getting a clean slate to apply that lesson differently. It has space to think.

The result is **emergent design**. Like how individual ants follow simple rules but colonies exhibit complex intelligent behavior, the Ketchup Technique produces sophisticated architecture through simple, repeated cycles.

Each burst behaves like an ant. The system that emerges is something none of the individual bursts planned.

### 100% Coverage for Free

The 100% code coverage requirement sounds extreme. It would be extreme for humans—tedious, time-consuming, often impractical.

But with true TDD, 100% coverage should be free.

If you're genuinely driving every piece of your system with a test first, nothing should be uncovered. An uncovered line means you wrote code that wasn't demanded by a test. That's a smell.

The coverage requirement isn't extra work. It's a check that the discipline is being followed.

---

## The Evolution

### From Markdown to Hooks

The first implementation was just a CLAUDE.md file—instructions the AI would read and (theoretically) follow. It worked, sometimes. But it wasn't enforced strongly enough.

I noticed other approaches emerging. The "Ralph Loop" technique—infinite continue until done. Claude's planning mode capabilities. Various hook systems for intercepting AI behavior.

I started pairing all of that with the Ketchup principles. The hook system was the key. I could actually enforce the rules, not just suggest them.

The breakthrough was realizing that Bottles and Bursts enable parallelization. If bursts are truly independent, multiple sub-agents can work simultaneously, each following the same hooks, each held to the same TCR discipline.

### Battle Testing

I built over ten features for Auto using the technique, nursing it along, automating more of what needed nursing, refining the hooks, tuning the behaviors.

It took time to get here. I'd notice a place where Claude was misbehaving and think, "Can I automate a fix for that?" Usually I could. A new hook, a new validation, a new skill.

The technique evolved to be collaborative—team members could contribute without understanding every detail, because the hooks enforce the discipline automatically. And it's designed to coexist: it doesn't override existing project configurations, just adds its layer of structure.

---

## How It Works

### The Loop

```
Red → Green → TCR → Refactor → TCR → Done
```

Write a failing test. Write minimal code to pass it. Run TCR—if tests pass, commit; if they fail, revert. Refactor if needed, TCR again. Move to the next burst.

One test. One behavior. One commit. No exceptions.

### The Philosophy

Just like with real ketchup, you don't dump the whole bottle on your plate. You dispense it in controlled bursts.

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

Most importantly, it harnesses AI's enthusiasm without being overwhelmed by it. The machine's energy gets channeled through a controlled dispenser, one burst at a time.

---

*Note on Inspiration: The Ketchup Technique is an independent methodology built specifically for AI-native development cycles. While it acknowledges the foundation of time-boxed, focused intervals found in the Pomodoro® Technique (a registered trademark of Francesco Cirillo), it is a separate method with different mechanics and goals. Learn more about the original human-focused technique at [pomodorotechnique.com](http://pomodorotechnique.com/).*
