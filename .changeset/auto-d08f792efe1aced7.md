---
"@xolvio/claude-ketchup": minor
---

- Added reminders system to replace skills, enabling context-aware prompts based on hook type, tool names, and custom conditions
- Added activity logging with session tracking and configurable filtering via KETCHUP_LOG environment variable
- Added auto-continue feature for Stop hook to manage session continuation behavior
- Added appeal system for commit validation, allowing developers to override certain validator blocks with documented reasons
- Improved CI/CD pipeline with changeset generation, turbo caching, and GitHub Packages publishing
- Added configurable ketchup directory paths and improved postinstall setup
