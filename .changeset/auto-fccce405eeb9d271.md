---
"@xolvio/claude-ketchup": minor
---

- Added `install` CLI command so users can set up hooks by running `claude-ketchup install`
- Added structured execution logging for all hooks, capturing input, output, diagnostics, and errors to `.claude/logs/hooks/`
- Exposed diagnostics from session-start and user-prompt-submit hooks, including resolved paths and matched reminders
- Expanded documentation with the full Ketchup technique guide covering the core loop, bursts, workflow, coverage rules, and testing principles
