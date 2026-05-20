# claude-ketchup

## 0.23.0

### Minor Changes

- 8be9402: - Rebranded the project to Ketchup, renaming the package, plugin, slash commands, data directory (.ketchup), and all documentation
  - Switched to plugin-only installation via the marketplace, removing the legacy npx CLI, install/doctor/repair commands, and symlink setup
  - Added automatic migration so existing setups upgrade in place, moving the data directory, state file, and deny-list to their new .ketchup locations
  - Removed the auto-continue feature in favor of parallel sub-agent planning, with config and docs updated to match
  - Added runtime configuration for validators and reminders, plus a config skill and first-setup guidance

## 0.22.4

### Patch Changes

- 40c6366: - Updated plugin installation instructions in the documentation for clearer setup guidance

## 0.22.3

### Patch Changes

- 38eb02d: - Cleaned up mobile homepage by removing duplicate brand wordmarks for a less cluttered look
  - Stacked mobile call-to-action buttons full-width so they read as a single clear column
  - Refined bento card layout with roomier padding, larger icons, and tighter text columns for better readability

## 0.22.2

### Patch Changes

- e0b4014: - Restored the `ketchup-` prefix on skill names so commands invoke correctly as `/ketchup:init` and similar
- e0b4014: - Restored slash command namespacing so skills are invoked as /ketchup:init, /ketchup:review, etc.

## 0.22.1

### Patch Changes

- 8511599: - Renamed slash commands to use the /ketchup: namespace (e.g. /ketchup:init), preventing conflicts with other plugins

## 0.22.0

### Minor Changes

- fd4f635: - Added automatic migration from the legacy `.claude-auto` directory to the new `.ketchup` directory on first plugin load after the rebrand
  - Migration is safe and idempotent: skips when already migrated, and avoids overwriting if both directories exist
- fdb2169: - Moved deny-list files from .claude/ into .ketchup/ so all project-local Ketchup config lives in one place
  - Added automatic migration that relocates existing deny-list files on first session start, with no manual steps required
- 752d66e: - Added centralized brand constants module to enable one-file rebrands
  - Prepared groundwork for the Ketchup rebrand across package name, data directory, and documentation URLs
- fb4b30c: - Automatically migrate projects from the legacy `.claude-auto` directory to `.ketchup` on first plugin load, so existing setups upgrade seamlessly without manual intervention
- 0e5128c: - Renamed the state file to `.ketchup/state.json` for a cleaner, brand-aligned name
  - Added automatic migration that renames the legacy state file in place on first session start, so existing setups upgrade seamlessly

### Patch Changes

- 3d751ae: - Updated marketplace dispatch workflow to reference the renamed ketchup plugin
  - Refreshed tail-logs script header to reflect the Ketchup brand
- 3d63e34: - Rewrote the parallelization reminder to guide planning in dependency-aware bursts before launching work
  - Shifted guidance toward dispatching independent bursts as sub-agents that commit their own work, with validators and deny-list protection applied to each
- 7b8f1da: - Updated architecture docs to reflect the current Guardrail Stack, replacing outdated Quality-Loop and Auto-Planner references
  - Refreshed the Getting Started guide with accurate component descriptions and added TCR gate coverage
  - Rewrote the project overview to frame Ketchup around guardrails and impartial subagent validation
- 9d57818: - Refreshed hero image for a cleaner landing page look
  - Clarified getting started guide to better explain Ketchup's features
- 0711726: - Replaced Auto-Continue feature with parallel subagent planning driven by ketchup-plan.md dependency notation
  - Removed Stop hook documentation, auto-continue state config, and AUTO_AUTO_CONTINUE environment variable
  - Updated homepage, README, architecture diagrams, and getting-started guide to reflect the new parallel sub-agent workflow
  - Simplified hook reference tables and quick reference by dropping obsolete Stop hook entries
- 211458f: - Rewrote homepage feature cards with descriptive category names and natural-prose bodies
  - Updated documented counts to 20+ validators and 9+ reminders across README, brand, VitePress meta, and OG description
  - Refreshed operational-concerns, validators-guide, origin-story, and CLAUDE.md to match the new framing
- 96535a7: - Renamed internal initialization function from initClaudeAuto to initKetchup for consistency with the Ketchup rebrand
  - Updated init hint to point at the new /ketchup:config slash command
  - Replaced hard-coded '.claude-auto' path strings with centralized BRAND constants
- 92e47fc: - Rewrote homepage feature cards for clearer, more accurate messaging
  - Clarified that reminders fire at user-chosen hook points, not every prompt
  - Reframed deny-list description to lead with its value over implementation detail
  - Renamed sections to emphasize smart parallel planning and emergent design through TCR
  - Corrected formal appeals framing to reflect that appeals target the LLM, not the human
- fb0b235: - Replaced em dashes with colons in guardrail-engineering and ketchup-technique pages for clearer bullet-list separators
  - Updated origin-story wording from "higher-leverage" to "higher-value" for more natural phrasing
- da7ba63: - Rewrote the Ketchup Technique documentation to focus on the planning methodology: Bursts, Bottles, ketchup-plan.md, and the TCR cycle
  - Added a cross-link section explaining how the Ketchup Technique relates to Guardrail Engineering
  - Standardized on Validators terminology throughout the documentation
  - Removed outdated claims and framing that no longer match what ships in code
- b668538: - Rebranded to Ketchup (npm package ketchup) with updated installation instructions
  - Added `/ketchup:init` activation step for opting in per repository
  - Migrated project config directory from `.claude-auto/` to `.ketchup/` automatically on first session
- 0490a1f: - Added See-it-work validator with a NACK transcript demo to show what commit rejection looks like in practice
  - Included a 30-second axios validator example for writing your own guardrails
- acd20b0: - Smoothed choppy sentence fragments across documentation for better readability
  - Rewrote key passages in origin story, homepage, and README for improved flow
  - Tightened prose in guardrail engineering, ketchup technique, and stack sections
- fb04d1c: - Renamed project data directory from .claude-auto to .ketchup as part of the ongoing rebrand
  - Centralized the data directory name through a single brand constant so future renames stay consistent
- 7ebebb3: - Updated test suite to reference the new .ketchup data directory name for consistency with the recent rename
  - Renamed temp directory prefixes from claude-auto-_ to ketchup-_ across fixture helpers
- 48fed8d: - **core**: update project references from CLAUDE_AUTO to KETCHUP and add state configuration
- 2513480: - Renamed slash commands to /ketchup-config and /ketchup-init for consistency with the Ketchup brand
- e077864: - Rebranded documentation site to Ketchup with new site URL at ketchup.on.auto
  - Updated GitHub links and edit references to the BeOnAuto/ketchup repository
  - Refreshed Open Graph and Twitter preview metadata for social sharing
  - Renamed "Supervisor AI" to "Validators" throughout to align with voice guidelines
  - Added "In the Stack" navigation and sidebar entries for the upcoming bridge page
- a93e2e4: - Removed the redundant Claude Auto Core Reminder, since validators already enforce the same rules at commit time and the per-prompt reminder continues to surface the workflow
- 9c41ba7: - Renamed npm package and plugin to ketchup
  - Updated repository URL to BeOnAuto/ketchup
  - Added keywords for ketchup, TCR, quality-loop, and parallel-agents
- 0781c39: - Renamed product from Claude Auto to Ketchup across all documentation
  - Updated package name to ketchup and domain to ketchup.on.auto
  - Renamed data directory from .claude-auto to .ketchup
  - Renamed Supervisor AI component to Validators for consistency
- b60600f: - Added Operational Concerns page with honest disclosure of cost, latency, and false-positive rates
  - Linked the new page from the homepage and added it to the docs sidebar Reference section
- 7e627fc: - Replaced hero imagery with new KETCHUP wordmark variants for light and dark themes
  - Updated OG preview image to match the new branding
  - Removed outdated CLAUDE-AUTO hero artwork
- f20ddb1: - Rebranded package identity from "claude-auto" to "ketchup" across user-facing messages, init command, and documentation URL
  - Updated display name to "Ketchup" in error messages and deny-list reasons
  - Relocated debug logs to .ketchup/logs/ketchup/ directory
  - Changed debug namespace from claude-auto to ketchup
- e0b88fb: - **core**: rename CLAUDE_AUTO_DEBUG env var to KETCHUP_DEBUG
- d234876: - Reframed origin story from babysitter to guardrail engineer, emphasizing encoded negative knowledge over worktree multiplication
  - Removed Quality Loop table referencing the non-existent Auto-Planner
  - Removed Before/After marketing comparison table
  - Preserved XP/TDD/TCR lineage, Kent Beck anecdote, and Bottles/Bursts naming history
  - Preserved the revert-as-information insight
- 02719aa: - Renamed the config skill from claude-auto-config to ketchup-config
  - Updated skill description and frontmatter to match the Ketchup brand voice
- 024f13f: - Clarified documentation to accurately describe when reminders fire at user-chosen hook points rather than on every prompt
- 6036e39: - Rewrote the homepage in the new Ketchup brand voice with updated lead paragraph
  - Added light/dark hero image variants that switch automatically
  - Introduced an "In the Stack" section linking to a dedicated page
  - Updated install commands to use /plugin install ketchup
  - Renamed Supervisor AI to Validators to align with voice guidelines
- 21af383: - Refreshed documentation voice by removing em dashes across CLAUDE.md, four docs pages, and two reminders
  - Replaced AI-flavored vocabulary ("leverage", "value compounds") with clearer alternatives in brand docs
- 4ccdef3: - Added "In the Stack" page explaining how Ketchup fits alongside Auto
  - Linked the new page from the README, homepage, and documentation navigation
- 98ee864: - Renamed the config skill from claude-auto-config to ketchup-config
  - Rewrote the skill description for the Ketchup brand voice
- 5579f53: - Rewrote README in Ketchup voice with new brand-doc structure, including lead paragraph and Why section
  - Added "In the Stack" bridge paragraph and Roadmap section for clearer scope expectations
  - Updated install commands to use /plugin install ketchup and switched data directory paths to .ketchup/
  - Documented automatic migration from .claude-auto for existing users
- 724c72e: - Trimmed the Origin Story by roughly 40% while preserving the XP/TCR lineage, Beck reference, and per-failure validator examples
  - Reframed the Ketchup Technique intro around failure modes (Bottles/Bursts) and demoted etymology to a sidebar
  - Moved "In the Stack" out of the top nav and Introduction sidebar, linking it instead from a small footer below the homepage Get Started CTA
- 99a66f8: - Rewrote homepage around guardrail-engineering message with new hero and subheading
  - Replaced babysitter and worktree-multiplier framing with a feature grid of five shipping mechanisms plus Appeals
  - Added a "Why LLM guardrails" section aimed at experienced developers
- d44b5bb: - Fixed conflicting guidance that told agents to commit the local plan file, which is gitignored and meant to stay on your machine
- 5929c95: - Tightened homepage and README copy for clarity
  - Added explicit "Today: Claude Code only" note near install command to resolve scope ambiguity
  - Aligned Vitepress site description and OG meta with updated copy
- b95b93f: - Streamlined the In the Stack page for quicker scanning while preserving the stack table and Auto-to-Ketchup bridge
  - Added Guardrail Engineering to the top navigation and Methodology sidebar for easier discovery
  - Updated site description and social preview metadata to reflect the new tagline
- b46dbb6: - Updated hero and social preview images to feature the new "KETCHUP BY AUTO" wordmark
  - Refreshed both light and dark hero variants for consistent brand attribution
- 0cef0e7: - Renamed init skill from claude-auto-init to ketchup-init to align with the Ketchup brand
  - Updated skill description to reflect the new Ketchup branding
- 5333b89: - Updated README headline to "Turn every AI mistake into a rule AI cant repeat."
  - Added new subtitle highlighting 15+ guardrails on every AI commit
  - Rewrote the Why section around the semantic-vs-static failure distinction
  - Shrunk the in-the-stack section to align with the homepage docs
- c594ca4: - Added a new Guardrail Engineering page explaining the mechanism behind Ketchup
  - Documented the observe, encode, cant-repeat loop and how five mechanisms map to shipping features
  - Included a semantic vs static comparison table and details on the appeals escape hatch
- fd6a6aa: - Updated brand tagline and category copy constants to match the current homepage and OG metadata
  - Retired the old "Stop Babysitting / Start Parallelizing" messaging from internal copy sources
- ce12cd1: - Updated core configuration to include ketchup plan files

## 0.21.0

### Minor Changes

- b2cf282: - Allowed users to author their own validators in project-local `.claude-auto/validators/` while keeping the plugin's bundled validators protected from modification
- b2cf282: - Migrated to plugin-only mode with native Claude Code plugin support via the BeOnAuto/auto-plugins marketplace, removing the legacy npx CLI installation
  - Added a new config skill with runtime overrides for validators and reminders, plus first-setup guidance on initial plugin use
  - Added support for user-defined custom validators and reminders with documentation in the README
  - Fixed commit validation to respect the validateCommit.mode off setting, and resolved plugin path handling when only CLAUDE_PLUGIN_ROOT is set
  - Updated all documentation and install instructions for plugin-only mode

### Patch Changes

- b2cf282: - Clarified that plugin-bundled validators and reminders are loaded from the plugin root directory
- b2cf282: - Users can now freely create, edit, and delete their own validators in .claude-auto/validators/
  - Plugin's bundled validators remain protected from modification
- b2cf282: - Planned documentation fix for plugin-bundled validator path
- b2cf282: - Updated ketchup plan to reflect progress on completed bursts
- b2cf282: - Updated internal ketchup plan to mark burst 3 as complete

## 0.20.0

### Minor Changes

- 742659a: - Migrated to plugin-only mode with native Claude Code plugin support via BeOnAuto/auto-plugins marketplace
  - Removed legacy npx installation, CLI system, and associated commands (install, doctor, repair, status, reminders, tui)
  - Added runtime config management with overrides and first-setup guidance via new /claude-auto:config skill
  - Fixed commit validation to respect validateCommit.mode off setting
  - Fixed plugin path resolution for skills context when only CLAUDE_PLUGIN_ROOT is set

### Patch Changes

- 742659a: - Planned removal of npm publishing from release workflow
- 742659a: - Fixed release workflow to skip marketplace.json during version bumps
- 742659a: - Updated internal planning documentation to reflect completed work
- 742659a: - Removed legacy npm publish step from the release pipeline
  - Rewired downstream release gates to trigger from the version step
- 742659a: - Updated internal planning notes to reflect completed work
- 742659a: - Fixed CI version-bump loop to skip marketplace.json, preventing unintended modifications during releases

## 0.19.0

### Minor Changes

- bca0adb: - Added protection to block shell commands that attempt to modify or delete validator files
- fbdf54d: - Added `/claude-auto init` skill that sets up claude-auto in a project with a guided initialization flow
  - Included esbuild bundling configuration for the new init skill entry point
- bca0adb: - Protected validator files from unauthorized modifications by blocking Edit and Write operations
  - Blocked Bash commands that target validator files to prevent bypassing protections
  - Added path detection to identify protected validator files across the hook system
- fbdf54d: - Loggers become silent no-ops when the auto directory does not exist, preventing errors in unconfigured environments
- fbdf54d: - Switched to plugin-only mode, removing the legacy npx/CLI installation system entirely
  - Added plugin marketplace support for easier installation via Claude Code's plugin system
  - Added runtime configuration skill for managing validators and reminders with overrides
  - Fixed path resolution and commit validation settings when running as a plugin
  - Rewrote all documentation for the new plugin-only workflow
- bca0adb: - Added protection for validator files by blocking direct edits and writes through the pre-tool-use hook
- fbdf54d: - Refreshed init output with emojis for better readability
  - Removed interrupt directive from init messaging
- fbdf54d: - Added `initClaudeAuto` function that sets up the `.claude-auto` directory with default configuration
  - Automatically detects and updates `.gitignore` to exclude generated files
- fbdf54d: - Pre-tool-use and auto-continue hooks now return early when the auto directory is missing, avoiding errors in unconfigured projects
- bca0adb: - Added path protection utility for detecting validator files, enabling hooks to identify and safeguard validator-related paths
- fbdf54d: - Simplified initial setup by removing the first-setup-required flag
  - Hook state now returns sensible defaults when the auto directory doesn't exist yet, preventing errors on fresh installations
- fbdf54d: - Added a prompt after initialization that asks users if they want to review or customize their configuration
- bca0adb: - Switched to plugin-only mode, removing the legacy npx/CLI installation system entirely
  - Added plugin marketplace support for easier installation via BeOnAuto/auto-plugins
  - Added runtime configuration skill for managing validators and reminders with overrides
  - Fixed commit validation ignoring the "off" mode setting
  - Updated all documentation for plugin-only workflow
- fbdf54d: - Added emojis to the initialization hint message for better visibility
- fbdf54d: - Added human-readable formatting for init command output
- fbdf54d: - Replaced blocking first-setup flow with a non-blocking hint message shown on session start when the project is not yet initialized
  - Hooks now silently return early in uninitialized repos instead of interrupting the user
- fbdf54d: - Write and update operations now silently skip when the auto directory is missing, preventing errors in unconfigured projects
- fa2129f: - Migrated to plugin-only mode with native Claude Code plugin support via BeOnAuto/auto-plugins marketplace
  - Removed legacy npx installation, CLI system, and associated commands (install, doctor, repair, status, reminders, tui)
  - Added runtime config management with overrides and first-setup guidance via new /claude-auto:config skill
  - Fixed commit validation to respect validateCommit.mode off setting
  - Fixed plugin path resolution for skills context when only CLAUDE_PLUGIN_ROOT is set

### Patch Changes

- fbdf54d: - Removed unused firstSetupRequired field from hook state, simplifying the configuration interface
- fbdf54d: - Planned upcoming work to wrap the init hint message as a directive
- fbdf54d: - Simplified the initialization hint message to a plain one-line reminder for clearer, less intrusive guidance
- fbdf54d: - Planned upcoming fix for skill-name handling
- fbdf54d: - Fixed init hint message not appearing in sessions by ensuring Claude surfaces it to the user
- fbdf54d: - Updated internal planning documentation to reflect completed work
- fbdf54d: - Renamed skills to use consistent `/claude-auto-*` naming pattern (claude-auto-init and claude-auto-config)
- fbdf54d: - Updated internal ketchup plan to reflect completed burst 7.4
- fbdf54d: - Planned simplification of the session-start init hint message
- fa2129f: - Fixed release workflow to skip marketplace.json during version bumps
- fbdf54d: - Improved hook state initialization to avoid creating unnecessary directories
- fbdf54d: - Marked burst 7.1 as complete in the ketchup plan
- fbdf54d: - Updated internal planning notes to reflect completed work
- fbdf54d: - Fixed incorrect skill name in initialization hint so users see the correct `/claude-auto-init` command
- fbdf54d: - Changed the initialization hint message to be a directive, so Claude now actively mentions the hint to the user in its first response instead of silently absorbing it
- fa2129f: - Updated internal planning documentation to reflect completed work
- fbdf54d: - Updated all documentation to reflect the new opt-in activation model and renamed skills
  - Renamed `/claude-auto:config` to `/claude-auto-config` across all docs
  - Added references to `/claude-auto-init` for opt-in repository activation
  - Updated installation and getting-started guides to reflect the new plugin workflow
- fbdf54d: - Planned upcoming improvement to wrap the init configuration tip in a directive for better visibility
- fbdf54d: - Fixed init config tip so Claude reliably surfaces it to users
- fbdf54d: - Updated ketchup plan to reflect completed bursts
- fbdf54d: - Planned non-interrupting init message burst
- fa2129f: - Fixed CI version-bump loop to skip marketplace.json, preventing unintended modifications during releases
- fbdf54d: - Planned emoji-decorated styling for the initialization hint message

## 0.18.0

### Minor Changes

- 466a054: - Added native Claude Code plugin support with dual-mode operation alongside legacy install
  - Added runtime config management for validators and reminders via config skill, with first-setup guidance
  - Fixed commit validation to correctly skip when validateCommit mode is set to off
  - Added ketchup plan for legacy npx install removal

### Patch Changes

- 432dbaa: - Cleaned up lockfile after removing legacy dependencies
- 81ce412: - Fixed path resolution when only the plugin root directory is set, ensuring skills work correctly in environments where the data directory is not explicitly configured
- 1c8ed07: - Updated all documentation for plugin-only installation mode
  - Removed references to legacy npx CLI and symlink-based setup across all guides
  - Deleted obsolete npm package test workflow and local install spec
- be50887: - Added plugin marketplace support for easier installation and discovery
  - Bundled scripts are now tracked in git, enabling direct use in plugin mode
  - Automated version synchronization between plugin and marketplace during releases
- 315480a: - Fixed skills not working when run as shell commands by automatically detecting the plugin location from the script path instead of relying on environment variables
- 3f2c4b8: - Removed the entire CLI system including install, doctor, repair, status, and TUI commands
  - Claude Auto now requires plugin mode exclusively — install via `/plugin marketplace add BeOnAuto/auto-plugins`
  - Removed legacy dependencies (commander, cosmiconfig, yaml) reducing package size

## 0.17.0

### Minor Changes

- 7f1c8a4: - Added runtime configuration management for validators and reminders via overrides in hook state
  - Added /claude-auto:config skill for managing configuration
  - Added first-setup guidance displayed on initial plugin use
  - Documented custom validators and reminders in README
- cdc45a8: - Added native Claude Code plugin support as an alternative to the legacy install method
  - Runtime automatically detects which mode is active via CLAUDE_PLUGIN_ROOT environment variable
  - Existing installations continue to work without changes

### Patch Changes

- 57a518f: - Fixed commit validation ignoring the "off" setting, so disabling validators now works as expected

## 0.16.0

### Minor Changes

- 0fb3d3e: - **core**: add resolveClaudeDirFromScript for stable hook path resolution
- 21beaa7: - **core**: add runtime.json to gitignore patterns

### Patch Changes

- 8cb432b: - **global**: remove stale root .claude.hooks.json
- e22d722: - **core**: remove volatile fields from HookState
- f0b93ef: - **global**: update ketchup plan - all bursts complete
- fbcb127: - **hooks**: use \_\_dirname instead of process.cwd() for claudeDir resolution

## 0.15.0

### Minor Changes

- 0f4c87c: - **cli**: add CopyResult type to copyDir for tracking changes
- 79da7f0: - **cli**: add granular install update messaging

### Patch Changes

- f8c7c46: - **global**: update ketchup plan - granular messaging complete

## 0.14.1

### Patch Changes

- 42c93dc: - **core**: strip CLAUDECODE env var from spawned validator subprocesses
- c545253: - **core**: update ketchup plan - fix spawnAsync CLAUDECODE inheritance

## 0.14.0

### Minor Changes

- 8bb654c: - Hook errors are now logged to the main activity.log file, making failures easier to discover without checking individual hook log files
- af6797e: - Validator sessions are now detected by agent type instead of prompt content, making detection more reliable and less fragile
- b518201: - Skip loading reminders for validator subagent sessions during session start, reducing unnecessary overhead for ephemeral validation processes
- 43c688c: - Added detection of validator subagent sessions by identifying validation-specific tags in prompts
  - Enables skipping unnecessary reminder injection during commit validation, improving validation performance
- 52bd08e: - Added agent_type field to hook inputs, enabling hooks to detect whether they're running in a main session or a subagent
  - Validator subagents now skip reminder injection at session start and prompt submit, reducing noise during automated validation
- 26ce2a3: - Skip reminder injection for validator subagent sessions in both session-start and user-prompt-submit hooks, reducing unnecessary overhead during commit validation
  - Add isValidatorSession utility to detect when a session is running as a validator subagent
- 475b22c: - Added `--agent validator` flag to all validator subagent spawns, enabling hooks to detect and customize behavior for validator sessions
  - Created `.claude-auto/agents/validator.md` agent definition file for validator subagents
- b4ec2d5: - Added automatic copying of agent definitions during install to support commit validation subagents

### Patch Changes

- 0011b45: - Updated core module description to clarify its role as a subagent
- 06f5d8e: - Fixed git commands failing when claude-auto is installed in a non-git parent directory containing git repo subdirectories
  - Hook scripts now correctly use the working directory reported by Claude Code instead of the installation directory
- 21abd5e: - Added planning document for the skip reminders feature
- 9c0fa4d: - Updated ketchup plan to reflect all bursts complete

## 0.13.9

### Patch Changes

- 78cc2bd: - Fixed output format for UserPromptSubmit hooks to correctly use additionalContext for injecting reminders
  - Fixed output format for Stop hooks to use the proper decision/reason structure for auto-continue behavior
  - Removed unused parameter from prompt submission handler

## 0.13.8

### Patch Changes

- 0fc3250: - Fixed PreToolUse hook to use the correct Claude Code hook output format
  - Updated permission decision fields to match current Claude Code hook API (decision, reason, and result field names)
  - Changed block action value from 'block' to 'deny' per official documentation

## 0.13.7

### Patch Changes

- 05f2bc8: - Fixed hooks to use the updated hooks result format

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
