---
"claude-auto": minor
---

- Added session translation that reads Claude Code session files and converts them into a stream of events
- Supports multiple events per line, so entries like session start hooks produce both the session and hook events together
