---
"claude-ketchup": patch
---

- Fixed commit validation failing when the git hook runs from a parent directory that isn't a git repo, such as when using "cd /path/to/repo && git commit"
- Version bump for released packages
