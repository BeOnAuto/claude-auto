#!/usr/bin/env tsx
/**
 * AI-powered changeset generation script
 *
 * This script:
 * 1. Gets commits since last changeset/tag
 * 2. Parses conventional commits (feat/fix/etc)
 * 3. Determines bump type (breaking→major, feat→minor, else→patch)
 * 4. Generates changelog via Claude CLI (with simple fallback)
 * 5. Creates .changeset/*.md file
 */

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Exit codes
const EXIT_CODE = {
  SUCCESS: 0,
  ERROR: 1,
  NO_COMMITS: 11,
  NO_CONVENTIONAL_COMMITS: 12,
};

// Types
type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';
type BumpType = 'major' | 'minor' | 'patch';

interface ConventionalCommit {
  hash: string;
  type: CommitType;
  scope?: string;
  subject: string;
  body?: string;
  breaking: boolean;
  fullMessage: string;
}

// Conventional commit pattern
const CONVENTIONAL_PATTERN = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?: (.+)/;

// Configuration
const CHANGESET_DIR = '.changeset';
const PACKAGE_NAME = '@xolvio/claude-ketchup';

// Logging utilities
function logStep(message: string): void {
  console.log(`\n📋 ${message}`);
}

function logInfo(message: string): void {
  console.log(`   ${message}`);
}

function logSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

function logWarning(message: string): void {
  console.warn(`⚠️  ${message}`);
}

function logError(message: string): void {
  console.error(`❌ ${message}`);
}

// Git utilities
function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getCommitMessage(hash: string): string {
  return execSync(`git log -1 --format=%B ${hash}`, { encoding: 'utf8' }).trim();
}

function getCommitsSinceLastChangeset(): string[] {
  try {
    const changesetPath = join(process.cwd(), CHANGESET_DIR);

    if (!existsSync(changesetPath)) {
      return getCommitsSinceLastTag();
    }

    const files = readdirSync(changesetPath).filter((f) => f.endsWith('.md') && f !== 'README.md');

    if (files.length === 0) {
      return getCommitsSinceLastTag();
    }

    // Get the most recent changeset file by git commit time
    const latestChangeset = files
      .map((f) => {
        try {
          const time = execSync(`git log -1 --format=%ct -- ${CHANGESET_DIR}/${f}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
          }).trim();
          return { file: f, time: Number(time) || 0 };
        } catch {
          return { file: f, time: 0 };
        }
      })
      .filter((f) => f.time > 0)
      .sort((a, b) => b.time - a.time)[0];

    if (!latestChangeset) {
      return getCommitsSinceLastTag();
    }

    // Get commits since that changeset was added
    const changesetCommit = execSync(`git log -1 --format=%H -- ${CHANGESET_DIR}/${latestChangeset.file}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return getCommitsInRange(changesetCommit, 'HEAD');
  } catch (error) {
    logWarning(`Could not get commits since last changeset: ${(error as Error).message}`);
    return [];
  }
}

function getCommitsInRange(since: string, until = 'HEAD'): string[] {
  try {
    const output = execSync(`git log ${since}..${until} --format=%H`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getCommitsSinceLastTag(): string[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return getCommitsInRange(lastTag, 'HEAD');
  } catch {
    // No tags exist, get recent commits (limit to 50)
    try {
      const output = execSync('git log -50 --format=%H', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();

      return output ? output.split('\n').filter(Boolean) : [];
    } catch {
      return [];
    }
  }
}

// Parsing utilities
function parseConventionalCommit(hash: string): ConventionalCommit | null {
  try {
    const fullMessage = getCommitMessage(hash);
    const match = fullMessage.match(CONVENTIONAL_PATTERN);

    if (!match) {
      return null;
    }

    const [, type, , scope, subject] = match;
    const body = fullMessage.split('\n').slice(1).join('\n').trim();
    const breaking = fullMessage.includes('BREAKING CHANGE:') || fullMessage.includes('!:');

    return {
      hash,
      type: type as CommitType,
      scope,
      subject,
      body,
      breaking,
      fullMessage,
    };
  } catch {
    return null;
  }
}

function parseConventionalCommits(hashes: string[]): ConventionalCommit[] {
  return hashes.map((hash) => parseConventionalCommit(hash)).filter((c): c is ConventionalCommit => c !== null);
}

// Semver utilities
function determineBumpType(commits: ConventionalCommit[]): BumpType {
  if (commits.some((c) => c.breaking)) {
    return 'major';
  }

  if (commits.some((c) => c.type === 'feat')) {
    return 'minor';
  }

  return 'patch';
}

// Changelog generation
async function generateChangelogWithClaude(commits: ConventionalCommit[]): Promise<string | null> {
  try {
    // Check if claude CLI is available
    execSync('which claude', { stdio: 'pipe' });

    const commitSummary = commits
      .map((c) => `- ${c.type}${c.scope ? `(${c.scope})` : ''}: ${c.subject}\n  ${c.body || '(no additional details)'}`)
      .join('\n\n');

    const prompt = `You are analyzing git commits to generate a changelog entry. Here are the commits:

${commitSummary}

Generate a concise changelog description as bullet points. Rules:
- Use 2-5 bullet points maximum
- Focus on user-facing changes and impact
- Group related changes together
- Use clear, non-technical language where possible
- Start each bullet with a dash and capitalize the first word
- Do NOT include commit hashes, types, or scopes
- Do NOT use markdown formatting besides the dashes

Example format:
- Added user authentication with OAuth support
- Fixed critical bug in data synchronization
- Improved performance of search queries by 50%

Now generate the changelog for the commits above:`;

    const tempFile = join(process.cwd(), `.changeset-prompt-${Date.now()}.txt`);
    writeFileSync(tempFile, prompt);

    try {
      const result = execSync(`claude -p "$(cat ${tempFile})"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      });

      return result.trim();
    } finally {
      try {
        execSync(`rm ${tempFile}`, { stdio: 'pipe' });
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch {
    return null;
  }
}

function generateSimpleChangelog(commits: ConventionalCommit[]): string {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const others = commits.filter((c) => !['feat', 'fix'].includes(c.type));

  const lines: string[] = [];

  if (features.length > 0) {
    lines.push(...features.map((c) => `- ${c.scope ? `**${c.scope}**: ` : ''}${c.subject}`));
  }

  if (fixes.length > 0) {
    lines.push(...fixes.map((c) => `- ${c.scope ? `**${c.scope}**: ` : ''}${c.subject}`));
  }

  if (others.length > 0 && lines.length < 5) {
    lines.push(...others.map((c) => `- ${c.scope ? `**${c.scope}**: ` : ''}${c.subject}`).slice(0, 5 - lines.length));
  }

  return lines.slice(0, 5).join('\n');
}

async function generateChangelog(commits: ConventionalCommit[]): Promise<string> {
  logInfo('Attempting to generate changelog with Claude CLI...');

  const aiChangelog = await generateChangelogWithClaude(commits);

  if (aiChangelog) {
    logSuccess('Changelog generated with Claude CLI');
    return aiChangelog;
  }

  logWarning('Claude CLI not available, using simple changelog generation');
  return generateSimpleChangelog(commits);
}

// Changeset file creation
function createChangesetFile(bumpType: BumpType, description: string): { filename: string; content: string } {
  const changesetDir = join(process.cwd(), CHANGESET_DIR);

  if (!existsSync(changesetDir)) {
    mkdirSync(changesetDir, { recursive: true });
  }

  const id = randomBytes(8).toString('hex');
  const filename = `auto-${id}.md`;
  const filepath = join(changesetDir, filename);

  const content = `---
"${PACKAGE_NAME}": ${bumpType}
---

${description}
`;

  writeFileSync(filepath, content);

  return { filename, content };
}

// Main function
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    if (!isGitRepository()) {
      logError('Not a git repository');
      process.exit(EXIT_CODE.ERROR);
    }

    logStep('Checking for commits that need changesets...');

    const commitHashes = getCommitsSinceLastChangeset();

    if (commitHashes.length === 0) {
      logInfo('No new commits found. Nothing to do.');
      process.exit(EXIT_CODE.NO_COMMITS);
    }

    logInfo(`Found ${commitHashes.length} commit(s) to process`);

    const commits = parseConventionalCommits(commitHashes);

    const skippedCount = commitHashes.length - commits.length;
    if (skippedCount > 0) {
      logWarning(`Skipped ${skippedCount} non-conventional commit(s). Use format: type(scope): subject`);
    }

    if (commits.length === 0) {
      logWarning('No conventional commits found. Skipping changeset generation.');
      logInfo('Commits must follow format: type(scope): subject (e.g., feat(cli): add new command)');
      process.exit(EXIT_CODE.NO_CONVENTIONAL_COMMITS);
    }

    logSuccess(`Found ${commits.length} valid conventional commit(s)`);

    const bumpType = determineBumpType(commits);
    logInfo(`Determined version bump: ${bumpType}`);

    const description = await generateChangelog(commits);

    if (dryRun) {
      console.log('\n📋 Changeset Preview:');
      console.log('---');
      console.log(`Bump type: ${bumpType}`);
      console.log(`Package: ${PACKAGE_NAME}`);
      console.log('\nChangelog:');
      console.log(description);
      console.log('---');
      process.exit(EXIT_CODE.SUCCESS);
    }

    const result = createChangesetFile(bumpType, description);

    logSuccess(`Created changeset: ${result.filename}`);
    logInfo(`  Bump type: ${bumpType}`);
    logInfo(`  Commits: ${commits.length}`);

    console.log('\n📋 Changelog preview:');
    console.log('---');
    console.log(description);
    console.log('---');

    process.exit(EXIT_CODE.SUCCESS);
  } catch (error) {
    logError(`Failed to generate changeset: ${(error as Error).message}`);
    process.exit(EXIT_CODE.ERROR);
  }
}

main();
