---
"claude-auto": minor
---

- Skip reminder injection for validator subagent sessions in both session-start and user-prompt-submit hooks, reducing unnecessary overhead during commit validation
- Add isValidatorSession utility to detect when a session is running as a validator subagent
