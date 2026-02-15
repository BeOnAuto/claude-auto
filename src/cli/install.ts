import * as fs from 'node:fs';
import * as path from 'node:path';

import { createHookState } from '../hook-state.js';

export type CopyResult = {
  added: string[];
  updated: string[];
  removed: string[];
};

export type InstallResult = {
  targetDir: string;
  claudeDir: string;
  settingsCreated: boolean;
  status: 'installed' | 'updated';
  scripts: CopyResult;
  validators: CopyResult;
  reminders: CopyResult;
  agents: CopyResult;
  commands: CopyResult;
};

function debug(...args: unknown[]): void {
  if (process.env.DEBUG) console.error('[claude-auto]', ...args);
}

export function resolveScriptPaths(template: string, projectRoot: string): string {
  const normalizedRoot = projectRoot.endsWith('/') ? projectRoot.slice(0, -1) : projectRoot;
  return template.replace(/node \.claude-auto\/scripts\//g, `node ${normalizedRoot}/.claude-auto/scripts/`);
}

export function getPackageRoot(startDir: string = __dirname): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      debug('packageRoot:', dir, '(startDir:', startDir, ')');
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`Could not find package root from ${startDir}`);
}

export function copyDir(sourceDir: string, targetDir: string): CopyResult {
  const result: CopyResult = { added: [], updated: [], removed: [] };
  debug('copyDir:', sourceDir, '→', targetDir);

  if (!fs.existsSync(sourceDir)) {
    debug('  source does not exist, skipping');
    return result;
  }

  const sourceEntries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const sourceFiles = sourceEntries.filter((e) => e.isFile()).map((e) => e.name);

  if (sourceFiles.length === 0) {
    debug('  source is empty, skipping');
    return result;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const targetFiles = fs.existsSync(targetDir)
    ? fs
        .readdirSync(targetDir, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name)
    : [];

  for (const fileName of sourceFiles) {
    const sourcePath = path.join(sourceDir, fileName);
    const targetPath = path.join(targetDir, fileName);
    const sourceContent = fs.readFileSync(sourcePath);

    if (!fs.existsSync(targetPath)) {
      debug('  add:', fileName);
      fs.copyFileSync(sourcePath, targetPath);
      result.added.push(fileName);
    } else {
      const targetContent = fs.readFileSync(targetPath);
      if (!sourceContent.equals(targetContent)) {
        debug('  update:', fileName);
        fs.copyFileSync(sourcePath, targetPath);
        result.updated.push(fileName);
      } else {
        debug('  skip (unchanged):', fileName);
      }
    }
  }

  for (const fileName of targetFiles) {
    if (!sourceFiles.includes(fileName)) {
      debug('  removed (in target only):', fileName);
      result.removed.push(fileName);
    }
  }

  return result;
}

export async function install(targetPath?: string, options?: { local?: boolean }): Promise<InstallResult> {
  const resolvedTarget = path.resolve(targetPath ?? '.');
  const claudeDir = path.join(resolvedTarget, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const autoDir = path.join(resolvedTarget, '.claude-auto');
  const pkgRoot = getPackageRoot();
  const local = options?.local ?? false;

  debug('target:', resolvedTarget);
  debug('claudeDir:', claudeDir);
  debug('local:', local);

  fs.mkdirSync(claudeDir, { recursive: true });

  // Migration: rename .ketchup/ → .claude-auto/ if needed
  const legacyDir = path.join(resolvedTarget, '.ketchup');
  if (fs.existsSync(legacyDir) && !fs.existsSync(autoDir)) {
    fs.renameSync(legacyDir, autoDir);
    console.log('Migrated .ketchup/ → .claude-auto/');
  }

  const hookStatePath = path.join(autoDir, '.claude.hooks.json');
  const alreadyInstalled = fs.existsSync(hookStatePath);

  let settingsCreated = false;
  if (!fs.existsSync(settingsPath)) {
    const templateName = local ? 'settings.local.json' : 'settings.json';
    const templatePath = path.join(pkgRoot, 'templates', templateName);
    debug('template:', templatePath);
    let template = fs.readFileSync(templatePath, 'utf-8');
    if (!local) {
      template = resolveScriptPaths(template, resolvedTarget);
    }
    fs.writeFileSync(settingsPath, template);
    settingsCreated = true;
    debug('settings.json created');
  } else {
    debug('settings.json already exists, skipping');
  }

  const emptyResult: CopyResult = { added: [], updated: [], removed: [] };

  const scripts = local
    ? emptyResult
    : copyDir(path.join(pkgRoot, 'dist', 'bundle', 'scripts'), path.join(autoDir, 'scripts'));

  const commands = copyDir(path.join(pkgRoot, 'commands'), path.join(claudeDir, 'commands'));

  const validators = local
    ? emptyResult
    : copyDir(path.join(pkgRoot, '.claude-auto', 'validators'), path.join(autoDir, 'validators'));

  const reminders = local
    ? emptyResult
    : copyDir(path.join(pkgRoot, '.claude-auto', 'reminders'), path.join(autoDir, 'reminders'));

  const agents = local
    ? emptyResult
    : copyDir(path.join(pkgRoot, '.claude-auto', 'agents'), path.join(claudeDir, 'agents'));

  // Initialize hook state with defaults if it doesn't exist
  const hookState = createHookState(autoDir);
  hookState.read();

  const status = alreadyInstalled ? 'updated' : 'installed';
  return {
    targetDir: resolvedTarget,
    claudeDir,
    settingsCreated,
    status,
    scripts,
    validators,
    reminders,
    agents,
    commands,
  };
}
