---
name: config-claude-auto
description: Manage claude-auto configuration — toggle validators, reminders, set hook options
user-invocable: true
argument-hint: show | set <key> <value> | validators [enable|disable|reset] <name> | reminders [enable|disable|priority|reset|add] <name>
---

!`node "${CLAUDE_PLUGIN_ROOT}/dist/bundle/scripts/config.js" $ARGUMENTS`
