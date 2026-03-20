#!/usr/bin/env npx tsx

import {
  addReminder,
  listReminders,
  listValidators,
  removeOverride,
  setConfigValue,
  setReminderPriority,
  showConfig,
  toggleReminder,
  toggleValidator,
} from '../src/config-manager.js';
import type { ResolvedPaths } from '../src/path-resolver.js';
import { resolvePathsFromEnv } from '../src/path-resolver.js';

const args = process.argv.slice(2);
const subcommand = args[0];

function usage(): string {
  return `Usage: /claude-auto:config <subcommand> [args]

Subcommands:
  show                              Show all current configuration
  set <key.path> <value>            Set a config value (e.g., autoContinue.mode off)
  validators                        List all validators with status
  validators enable <name>          Enable a validator
  validators disable <name>         Disable a validator
  validators reset <name>           Remove override, restore default
  reminders                         List all reminders with status
  reminders enable <name>           Re-enable a disabled reminder
  reminders disable <name>          Disable a reminder
  reminders priority <name> <n>     Override a reminder's priority
  reminders reset <name>            Remove override, restore default
  reminders add <name> [options]    Create a custom reminder
    --hook <hook>                   Hook point (SessionStart|PreToolUse|UserPromptSubmit|Stop)
    --priority <n>                  Priority (higher = first)
    --content <text>                Reminder content

Config keys:
  autoContinue.mode                 smart | non-stop | off
  autoContinue.maxIterations        number (0 = unlimited)
  autoContinue.skipModes            JSON array (e.g., ["plan"])
  validateCommit.mode               strict | warn | off
  validateCommit.batchCount         number
  denyList.enabled                  true | false
  denyList.extraPatterns            JSON array of glob patterns
  promptReminder.enabled            true | false
  promptReminder.customReminder     string
  subagentHooks.validateCommitOnExplore   true | false
  subagentHooks.validateCommitOnWork      true | false
  subagentHooks.validateCommitOnUnknown   true | false`;
}

function formatState(result: ReturnType<typeof showConfig>): string {
  const { state } = result;
  const lines: string[] = ['## Current Configuration\n'];

  lines.push('### Auto Continue');
  lines.push(`  mode: ${state.autoContinue.mode}`);
  lines.push(`  maxIterations: ${state.autoContinue.maxIterations}`);
  lines.push(`  skipModes: ${JSON.stringify(state.autoContinue.skipModes)}`);

  lines.push('\n### Commit Validation');
  lines.push(`  mode: ${state.validateCommit.mode}`);
  lines.push(`  batchCount: ${state.validateCommit.batchCount}`);

  lines.push('\n### Deny List');
  lines.push(`  enabled: ${state.denyList.enabled}`);
  lines.push(`  extraPatterns: ${JSON.stringify(state.denyList.extraPatterns)}`);

  lines.push('\n### Prompt Reminders');
  lines.push(`  enabled: ${state.promptReminder.enabled}`);
  if (state.promptReminder.customReminder) {
    lines.push(`  customReminder: ${state.promptReminder.customReminder}`);
  }

  lines.push('\n### Subagent Hooks');
  lines.push(`  validateCommitOnExplore: ${state.subagentHooks.validateCommitOnExplore}`);
  lines.push(`  validateCommitOnWork: ${state.subagentHooks.validateCommitOnWork}`);
  lines.push(`  validateCommitOnUnknown: ${state.subagentHooks.validateCommitOnUnknown}`);

  return lines.join('\n');
}

function formatValidators(validators: ReturnType<typeof listValidators>): string {
  const lines: string[] = ['## Validators\n'];
  for (const v of validators) {
    const status = v.enabled ? '[ON] ' : '[OFF]';
    const override = v.overridden ? ' (overridden)' : '';
    lines.push(`  ${status} ${v.name}${override} — ${v.description}`);
  }
  return lines.join('\n');
}

function formatReminders(reminders: ReturnType<typeof listReminders>): string {
  const lines: string[] = ['## Reminders\n'];
  for (const r of reminders) {
    const status = r.enabled ? '[ON] ' : '[OFF]';
    const override = r.overridden ? ' (overridden)' : '';
    lines.push(`  ${status} ${r.name} [hook:${r.hook}, priority:${r.priority}]${override}`);
  }
  return lines.join('\n');
}

function parseReminderAddArgs(remaining: string[]): { hook?: string; priority?: number; content: string } {
  let hook: string | undefined;
  let priority: number | undefined;
  let content = '';

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i] === '--hook' && remaining[i + 1]) {
      hook = remaining[++i];
    } else if (remaining[i] === '--priority' && remaining[i + 1]) {
      priority = Number.parseInt(remaining[++i], 10);
    } else if (remaining[i] === '--content') {
      content = remaining.slice(i + 1).join(' ');
      break;
    }
  }

  if (!content) {
    content = 'TODO: Add reminder content here';
  }

  return { hook, priority, content };
}

function handleShow(paths: ResolvedPaths): void {
  const result = showConfig(paths);
  console.log(formatState(result));
  console.log('');
  console.log(formatValidators(result.validators));
  console.log('');
  console.log(formatReminders(result.reminders));
}

function handleSet(paths: ResolvedPaths): void {
  const keyPath = args[1];
  const value = args[2];
  if (!keyPath || value === undefined) {
    console.error('Usage: config set <key.path> <value>');
    process.exit(1);
  }
  const state = setConfigValue(paths, keyPath, value);
  console.log(`Set ${keyPath} = ${JSON.stringify(value)}`);
  const section = keyPath.split('.')[0] as keyof typeof state;
  console.log(`\nCurrent ${section}:`, JSON.stringify(state[section], null, 2));
}

function handleValidators(paths: ResolvedPaths): void {
  const action = args[1];
  if (!action) {
    const validators = listValidators(paths);
    console.log(formatValidators(validators));
    return;
  }

  const name = args[2];
  if (!name) {
    console.error(`Usage: config validators ${action} <name>`);
    process.exit(1);
  }

  switch (action) {
    case 'enable':
      toggleValidator(paths, name, true);
      console.log(`Enabled validator: ${name}`);
      break;
    case 'disable':
      toggleValidator(paths, name, false);
      console.log(`Disabled validator: ${name}`);
      break;
    case 'reset':
      removeOverride(paths, 'validators', name);
      console.log(`Reset validator override: ${name}`);
      break;
    default:
      console.error(`Unknown validators action: ${action}`);
      process.exit(1);
  }
}

function handleReminders(paths: ResolvedPaths): void {
  const action = args[1];
  if (!action) {
    const reminders = listReminders(paths);
    console.log(formatReminders(reminders));
    return;
  }

  const name = args[2];
  if (!name) {
    console.error(`Usage: config reminders ${action} <name>`);
    process.exit(1);
  }

  switch (action) {
    case 'enable':
      toggleReminder(paths, name, true);
      console.log(`Enabled reminder: ${name}`);
      break;
    case 'disable':
      toggleReminder(paths, name, false);
      console.log(`Disabled reminder: ${name}`);
      break;
    case 'priority': {
      const priority = Number.parseInt(args[3], 10);
      if (Number.isNaN(priority)) {
        console.error('Usage: config reminders priority <name> <number>');
        process.exit(1);
      }
      setReminderPriority(paths, name, priority);
      console.log(`Set reminder ${name} priority to ${priority}`);
      break;
    }
    case 'reset':
      removeOverride(paths, 'reminders', name);
      console.log(`Reset reminder override: ${name}`);
      break;
    case 'add': {
      const options = parseReminderAddArgs(args.slice(3));
      const filePath = addReminder(paths, name, options);
      console.log(`Created reminder: ${filePath}`);
      break;
    }
    default:
      console.error(`Unknown reminders action: ${action}`);
      process.exit(1);
  }
}

(async () => {
  const paths = await resolvePathsFromEnv();

  switch (subcommand) {
    case 'show':
      handleShow(paths);
      break;
    case 'set':
      handleSet(paths);
      break;
    case 'validators':
      handleValidators(paths);
      break;
    case 'reminders':
      handleReminders(paths);
      break;
    default:
      console.log(usage());
      break;
  }
})();
