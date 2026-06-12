---
"claude-auto": minor
---

- Replaced blocking first-setup flow with a non-blocking hint message shown on session start when the project is not yet initialized
- Hooks now silently return early in uninitialized repos instead of interrupting the user
