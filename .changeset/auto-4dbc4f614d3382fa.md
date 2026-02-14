---
"claude-auto": patch
---

- Fixed git commands failing when claude-auto is installed in a non-git parent directory containing git repo subdirectories
- Hook scripts now correctly use the working directory reported by Claude Code instead of the installation directory
