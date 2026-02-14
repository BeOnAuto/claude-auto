---
"claude-auto": minor
---

- Added agent_type field to hook inputs, enabling hooks to detect whether they're running in a main session or a subagent
- Validator subagents now skip reminder injection at session start and prompt submit, reducing noise during automated validation
