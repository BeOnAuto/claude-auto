---
"claude-ketchup": patch
---

- Fixed commit validation failing when the git hook runs from a parent directory that isn't a git repo
- Improved handling of commands that change directories before committing
