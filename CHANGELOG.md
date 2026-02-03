# claude-ketchup

## 0.12.4

### Patch Changes

- ca9e197: - Updated section titles and improved table formatting in documentation
- 6f0ffe8: - Migrated internal tooling references to claude-auto

## 0.12.3

### Patch Changes

- 4173e92: Restore --no-session-persistence flag to Claude CLI calls in commit validator and changeset generator

## 0.12.2

### Patch Changes

- 1fb7d02: - Fixed commit validation system that was completely blocking all commits due to an invalid CLI flag
  - Improved error handling and messaging in the validation system to help diagnose issues faster

## 0.12.1

### Patch Changes

- f36cd07: - Updated documentation references to use the .ketchup directory and improved installation instructions
  - Removed outdated ketchup.md documentation file

## 0.12.0

### Minor Changes

- 8c39d2e: - Moved hook scripts from `.claude/scripts/` to `.ketchup/scripts/`, consolidating all ketchup runtime files under a single directory
  - Running `npx claude-ketchup install` now places scripts in the new location automatically

## 0.11.1

### Patch Changes

- 094494f: - Removed the `/ketchup` command which had no real functionality
  - Fixed directory copying to gracefully skip empty source directories

## 0.11.0

### Minor Changes

- fba8b01: - Added batched validator execution, running multiple validations per commit check instead of one at a time
  - Configurable batch count (default of 3) for controlling how many validators run simultaneously
  - Updated the pre-tool-use hook to pass batch count through the validation pipeline

## 0.10.0

### Minor Changes

- 2f568bf: - Fixed validator token counting to include cached tokens in the total, giving accurate API usage reporting
  - Added per-validator token usage (input/output) to activity logs for better observability
  - Improved validator reliability with fail-safe NACK defaults, automatic retry on invalid responses, and exclusion of appeal-system from regular runs
  - Switched validators to run in parallel for faster execution, with detailed activity logging

## 0.9.0

### Minor Changes

- 0180ad8: - Added local installation support for easier development setup
  - Enhanced the CLI installation process with improved directory structure
  - Reorganized internal configuration files into a dedicated .ketchup directory

## 0.8.6

### Patch Changes

- cfffa16: - Fixed hook logs being written to the wrong directory, now correctly stored in .ketchup/logs
  - Changed hook logging to append to a single file per hook instead of creating a new file each time
  - Added clearer status messages during installation to distinguish between fresh installs and updates

## 0.8.5

### Patch Changes

- 3197890: - Fixed hook state file not being created during installation, ensuring it exists immediately after install rather than only after the first hook runs

## 0.8.4

### Patch Changes

- 92ae830: - Moved log files to .ketchup/logs directory so all runtime data is consolidated under .ketchup
  - Moved hook state file to .ketchup/.claude.hooks.json to keep the project root clean

## 0.8.3

### Patch Changes

- 984c3e8: - Fixed commit validation failing when the git hook runs from a parent directory that isn't a git repo, such as when using "cd /path/to/repo && git commit"
  - Version bump for released packages

## 0.8.2

### Patch Changes

- 16af449: - Fixed commit validation failing when the git hook runs from a parent directory that isn't a git repo
  - Improved handling of commands that change directories before committing

## 0.8.1

### Patch Changes

- a8c63b2: - Fixed package root resolution that could fail in published/installed contexts
  - Added debug logging to the install process for easier diagnostics

## 0.8.0

### Minor Changes

- cd91632: - Added automatic devDependency installation so subsequent commands run faster without re-fetching from npm
  - Fixed package name resolution in CI workflows
  - Added daily automated testing workflow to verify npm package installation and commands

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
