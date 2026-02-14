---
"claude-auto": patch
---

- Fixed PreToolUse hook to use the correct Claude Code hook output format
- Updated permission decision fields to match current Claude Code hook API (decision, reason, and result field names)
- Changed block action value from 'block' to 'deny' per official documentation
