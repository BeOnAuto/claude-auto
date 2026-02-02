import * as fs from 'node:fs';
import * as path from 'node:path';

export type InstallResult = {
  targetDir: string;
  claudeDir: string;
  settingsCreated: boolean;
};

function getPackageRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

function copyDir(sourceDir: string, targetDir: string): void {
  if (!fs.existsSync(sourceDir)) {
    return;
  }
  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      fs.copyFileSync(path.join(sourceDir, entry.name), path.join(targetDir, entry.name));
    }
  }
}

export async function install(targetPath?: string): Promise<InstallResult> {
  const resolvedTarget = path.resolve(targetPath ?? '.');
  const claudeDir = path.join(resolvedTarget, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const pkgRoot = getPackageRoot();

  fs.mkdirSync(claudeDir, { recursive: true });

  let settingsCreated = false;
  if (!fs.existsSync(settingsPath)) {
    const templatePath = path.join(pkgRoot, 'templates', 'settings.json');
    const template = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(settingsPath, template);
    settingsCreated = true;
  }

  copyDir(path.join(pkgRoot, 'dist', 'bundle', 'scripts'), path.join(claudeDir, 'scripts'));
  copyDir(path.join(pkgRoot, 'commands'), path.join(claudeDir, 'commands'));

  const ketchupDir = path.join(resolvedTarget, '.ketchup');
  copyDir(path.join(pkgRoot, 'validators'), path.join(ketchupDir, 'validators'));
  copyDir(path.join(pkgRoot, 'reminders'), path.join(ketchupDir, 'reminders'));

  return { targetDir: resolvedTarget, claudeDir, settingsCreated };
}
