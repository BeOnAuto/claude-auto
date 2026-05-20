---
"ketchup": minor
---

- Rebranded the project to Ketchup, renaming the package, plugin, slash commands, data directory (.ketchup), and all documentation
- Switched to plugin-only installation via the marketplace, removing the legacy npx CLI, install/doctor/repair commands, and symlink setup
- Added automatic migration so existing setups upgrade in place, moving the data directory, state file, and deny-list to their new .ketchup locations
- Removed the auto-continue feature in favor of parallel sub-agent planning, with config and docs updated to match
- Added runtime configuration for validators and reminders, plus a config skill and first-setup guidance
