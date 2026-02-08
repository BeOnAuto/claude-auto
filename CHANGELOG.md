# claude-ketchup

## 0.13.6

### Patch Changes

- e0b8663: Fix hook scripts not found after cd command by using absolute paths in settings.json

## 0.13.5

### Patch Changes

- 3b09e31: - Enhanced clarity and detail in methodology documentation

## 0.13.4

### Patch Changes

- 45011c5: - Added test coverage for the TUI action error path when not configured
- df73523: - Export getPackageRoot function with optional startDir parameter for programmatic package root detection
  - Add comprehensive test coverage for getPackageRoot functionality
- 6091972: - Added test coverage for the SIGINT signal handler that stops the TUI and restores the cursor
- fa27eaf: - Simplified internal logging logic in pre-tool-use hook by removing unnecessary conditional code
- 16f6fc2: - Added test coverage for the TUI action's successful launch output
- 283bb43: - Removed unnecessary interval state checking code in log tailer to simplify implementation
- 1011ca9: - Added test coverage for CLI default action launching the TUI when configured
- 80a74e5: - Added test coverage for stdout, stderr, and error handling in the spawn async utility
- c88807b: - Added test coverage for error handling when the commit validator's executor throws an error
- 059a7b7: - Added test coverage for parsing Claude JSON output when cache token fields are missing
- 169ced8: This is a planning/infrastructure commit that added tasks to the ketchup plan but didn't make any user-facing changes. Since it's a `chore` commit that only modified the plan file, it doesn't represent actual feature delivery or bug fixes. This type of commit typically shouldn't appear in a user-facing changelog.

  However, if you need a changelog entry:

  - Added development plan for achieving 100% test coverage across the codebase

- e34de12: - Added test coverage for migrating from old `.ketchup` directory structure to new `.claude-auto` directory
- c04d3b8: Looking at the commit, this appears to be a test-only addition with no user-facing changes. For changelog purposes:

  - Added test coverage for maximum line enforcement during live log tailing

  However, if this is purely an internal test improvement with no user-facing behavioral changes, it might not warrant a changelog entry at all. Test-only commits typically don't appear in changelogs unless they're fixing a bug that was previously uncovered or documenting newly added behavior.

  Would you like me to:

  1. Omit this from the changelog (recommended for test-only commits)
  2. Keep the single bullet point above
  3. Review the actual code changes to see if there's a user-facing aspect I'm missing

- 1b484ae: - Added test coverage for handling missing input token counts during batch usage validation
- 11bc4d2: - Exported copyDir function from CLI package for external use
  - Added comprehensive test coverage for all three code branches in copyDir
- 1c98291: Looking at this commit, I can see it's a test-only change that adds coverage for a specific code path in the pre-tool-use hook. Since this is purely internal test coverage improvement with no user-facing changes, here's the changelog:

  - Improved test coverage for hook validation scenarios

- 7ba85aa: - Added test coverage for parsing batched output when receiving raw JSON arrays
- b3859e9: - Added runtime debug mode checking functionality with comprehensive test coverage
- 3296b16: These commits are all test coverage additions and minor refactors — no user-facing features, bug fixes, or behavioral changes. Here's the changelog:

  - Added comprehensive test coverage for CLI actions including install, TUI launch, and default help output
  - Added test coverage for core utilities including commit validation, output parsing, and process spawning
  - Added test coverage for hook behaviors including auto-continue and pre-tool-use validation
  - Removed dead code paths discovered during coverage improvements

- b9b802f: - Added test coverage for install action fresh-install logging in the CLI
- dbb0d6e: - Added test coverage for the install action's update message when a project is already installed
- 19fc1b6: - Added test coverage for handling missing input token counts in Claude JSON output parsing
- 971a22e: Looking at this commit, it's a test-only change with no user-facing functionality. Since this adds test coverage but doesn't modify behavior or add features:

  - Improved test coverage for installation command default behavior

- 2d6c555: - Added batch count tracking to hook state for better execution monitoring
  - Updated build configuration to ignore local install scripts
- e480dfd: - Added test coverage for validator-loader to verify it correctly skips non-markdown files
- b94a7d3: - Added test coverage for terminal resize handler when column and row values are missing
- e7a1949: - Added test coverage for the terminal resize handler that updates TUI dimensions
- cc4f38b: - Added test coverage for handling unexpected input types in batched output parsing
- f83607e: - Added test coverage for commit validation token logging when usage data is absent or cache fields are missing
- 712987e: - Added test coverage for log file deletion during active tailing operations
- ccf4fb2: - Added test coverage for TUI re-rendering when new log lines arrive
- 35252ce: - Added CLAUDE.md file with comprehensive development guidance for the codebase
- 1d891e4: Based on all the commits on this branch:

  - Added test coverage for core parsing functions, log tailing, and async process spawning
  - Added test coverage for CLI installation paths, migration handling, and package resolution
  - Added test coverage for hook validators, auto-continue behavior, and pre-tool-use paths
  - Fixed a bug where the Claude CLI plugin system could corrupt the git index
  - Removed dead code in hooks and log-tailer modules to improve maintainability

- afcbd85: - Rewrote README with problem-solution framing for clearer project communication
- f7ad835: - Added test coverage for JSON array parsing error handling in core module
- dfbba6a: - Improved test coverage for auto-continue hook edge cases when no work remains or TODO header is missing
- eeb8239: - Added test coverage for JSON array extraction error handling when bracket parsing fails
- 55f38a7: - Added test coverage for appeal prompt formatting when results have no reason provided
- 596ce57: - Made auto-continue hook configuration more explicit by requiring skipModes to be specified
  - Added test coverage to ensure plan mode is skipped by default when using auto-continue

## 0.13.3

### Patch Changes

- 160022c: - Standardized numeric claims across documentation: "3-5" for parallel capacity, "10+" for weekly throughput, and "10x+" for multiplier claims
  - Updated messaging tone to emphasize confident delegation over passive automation, replacing "walk away" with "shift focus" and "let it run"
  - Refined trust and autonomy language to better reflect the director-style workflow the product enables

## 0.13.2

### Patch Changes

- edbbcc7: - Fixed an issue where the Claude CLI plugin system could corrupt the project's git index, causing fatal errors during commits
  - Added safety guard to prevent plugin marketplace files from leaking into project repositories
  - Updated documentation descriptions and taglines for clarity and consistency
- edbbcc7: - Updated documentation descriptions and taglines for improved clarity and consistency
- edbbcc7: - Updated documentation descriptions and taglines for improved clarity and consistency

## 0.13.1

### Patch Changes

- 7398da3: - Moved changeset generation from pre-push to post-commit hook to prevent double CI runs and ensure changesets are included in push history
- 7398da3: - Updated documentation terminology from "Quality Loop" to revised naming and added supporting imagery
- 7398da3: - Fixed changeset generation timing to prevent double CI runs when pushing changes
  - Moved automatic changeset creation to run immediately after commits instead of during push, ensuring changesets are properly included in git history

## 0.13.0

### Minor Changes

- a284578: - Added interactive terminal UI with real-time log tailing, screen rendering, and waiting state display
  - Added log colorization for improved readability of CLI output
  - Added auto-configuration detection for TUI setup
  - Renamed project from "ketchup" to "auto" across the codebase

## 0.12.5

### Patch Changes

- 8b06629: - Updated site URL and base path configuration for the production documentation site

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
