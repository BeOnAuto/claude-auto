# @xolvio/claude-ketchup

## 0.4.0

### Minor Changes

- [`e6b4a24`](https://github.com/xolvio/claude-ketchup/commit/e6b4a241383b49f70fc8f82d441a405a9dd156a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Added reminders system to replace skills, enabling context-aware prompts based on hook type, tool names, and custom conditions
  - Added activity logging with session tracking and configurable filtering via KETCHUP_LOG environment variable
  - Added auto-continue feature for Stop hook to manage session continuation behavior
  - Added appeal system for commit validation, allowing developers to override certain validator blocks with documented reasons
  - Improved CI/CD pipeline with changeset generation, turbo caching, and GitHub Packages publishing
  - Added configurable ketchup directory paths and improved postinstall setup

## 0.3.0

### Minor Changes

- [`ddd2f7d`](https://github.com/xolvio/claude-ketchup/commit/ddd2f7daaf57285c075637f093c8a8583df85ca2) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Added reminders system replacing skills for context-aware prompts with YAML frontmatter configuration
  - Implemented activity logging with session tracking and configurable filtering via KETCHUP_LOG environment variable
  - Added commit validation system with appealable validators for burst atomicity, coverage rules, testing practices, and dangerous git operations
  - Set up CI/CD with automated releases, turbo caching, and GitHub Packages publishing
  - Added auto-continue hook for managing stop behavior with configurable modes
