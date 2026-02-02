import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('settings template', () => {
  it('uses .ketchup/scripts paths for hook commands', () => {
    const templatePath = path.resolve(__dirname, '..', 'templates', 'settings.json');
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

    const commands: string[] = [];
    for (const hookType of Object.keys(template.hooks)) {
      const hookGroups = template.hooks[hookType];
      for (const group of hookGroups) {
        for (const hook of group.hooks) {
          if (hook.command) {
            commands.push(hook.command);
          }
        }
      }
    }

    for (const command of commands) {
      expect(command).not.toContain('node_modules/claude-ketchup');
    }
  });

  it('uses node for .js files instead of npx tsx', () => {
    const templatePath = path.resolve(__dirname, '..', 'templates', 'settings.json');
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

    const commands: string[] = [];
    for (const hookType of Object.keys(template.hooks)) {
      const hookGroups = template.hooks[hookType];
      for (const group of hookGroups) {
        for (const hook of group.hooks) {
          if (hook.command) {
            commands.push(hook.command);
          }
        }
      }
    }

    for (const command of commands) {
      if (command.endsWith('.js')) {
        expect(command).toMatch(/^node /);
      }
    }
  });

  it('PreToolUse handles Bash via pre-tool-use.js, not separate validate-commit.ts', () => {
    const templatePath = path.resolve(__dirname, '..', 'templates', 'settings.json');
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

    const preToolUseHooks = template.hooks.PreToolUse;
    expect(preToolUseHooks).toHaveLength(1);

    const hook = preToolUseHooks[0];
    expect(hook.matcher).toBe('Edit|Write|NotebookEdit|Bash');
    expect(hook.hooks[0].command).toBe('node .ketchup/scripts/pre-tool-use.js');
  });
});
