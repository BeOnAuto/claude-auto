# claude-ketchup

## 0.7.0

### Minor Changes

- 6510c34: - Added install command so users can run `claude-ketchup install` to set up hooks directly
  - Added hook execution logging and diagnostics for debugging and auditing all hook invocations
  - Replaced the skills system with a new reminders system, including frontmatter-based matching rules
  - Added auto-continue stop hook, activity logging with KETCHUP_LOG filtering, and session input parsing across all hooks
  - Set up CI pipeline with automated releases, changeset generation, and GitHub Packages publishing

### Patch Changes

- f24454f: - Fixed pre-push hook failing when there are no new commits to check

## 0.6.0

### Minor Changes

- 18bd66d: - Completed comprehensive documentation overhaul with new installation guide, reminders guide, validators guide, and improved organization
  - Updated all documentation to use `npx claude-ketchup install` as primary installation method
  - Removed duplicate content across documentation files and established single source of truth for each topic
  - Fixed broken links, inconsistent terminology, and improved narrative flow throughout all guides
  - Added VitePress documentation site with automated deployment to GitHub Pages

## 0.5.0

### Minor Changes

- 58d1c58: Looking at these commits, I can see they represent a substantial development arc for the claude-ketchup project. Let me generate a concise changelog focusing on the most significant user-facing changes:

  - Implemented AI-powered commit validation with an appeal system that allows developers to override certain validation failures with justification
  - Added comprehensive activity logging with filtering capabilities to track hook executions and debug issues
  - Introduced a reminders system that replaces the previous skills system, allowing contextual information to be injected at different hook points
  - Set up automated changeset generation, turbo caching, and GitHub Packages publishing for streamlined releases
  - Added auto-continue functionality to control when Claude Code sessions should stop or continue automatically

- 9a20bd6: - Added `install` CLI command so users can set up hooks by running `claude-ketchup install`
  - Added structured execution logging for all hooks, capturing input, output, diagnostics, and errors to `.claude/logs/hooks/`
  - Exposed diagnostics from session-start and user-prompt-submit hooks, including resolved paths and matched reminders
  - Expanded documentation with the full Ketchup technique guide covering the core loop, bursts, workflow, coverage rules, and testing principles

### Patch Changes

- b4e0a4e: - Fixed GitHub Actions permissions error in the changelog generation process
  - Resolved CI build failures caused by invalid local path references in workspace configuration

## 0.4.0

### Minor Changes

- [`e6b4a24`](https://github.com/BeOnAuto/claude-ketchup/commit/e6b4a241383b49f70fc8f82d441a405a9dd156a0) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Added reminders system to replace skills, enabling context-aware prompts based on hook type, tool names, and custom conditions
  - Added activity logging with session tracking and configurable filtering via KETCHUP_LOG environment variable
  - Added auto-continue feature for Stop hook to manage session continuation behavior
  - Added appeal system for commit validation, allowing developers to override certain validator blocks with documented reasons
  - Improved CI/CD pipeline with changeset generation, turbo caching, and GitHub Packages publishing
  - Added configurable ketchup directory paths and improved postinstall setup

## 0.3.0

### Minor Changes

- [`ddd2f7d`](https://github.com/BeOnAuto/claude-ketchup/commit/ddd2f7daaf57285c075637f093c8a8583df85ca2) Thanks [@SamHatoum](https://github.com/SamHatoum)! - - Added reminders system replacing skills for context-aware prompts with YAML frontmatter configuration
  - Implemented activity logging with session tracking and configurable filtering via KETCHUP_LOG environment variable
  - Added commit validation system with appealable validators for burst atomicity, coverage rules, testing practices, and dangerous git operations
  - Set up CI/CD with automated releases, turbo caching, and GitHub Packages publishing
  - Added auto-continue hook for managing stop behavior with configurable modes
