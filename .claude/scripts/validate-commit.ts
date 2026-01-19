#!/usr/bin/env tsx

// Commit-level validation hook: validates all staged changes against CLAUDE.md rules.
// Triggers on Bash tool calls containing "git commit". Sees the full changeset holistically.
// Only affects LLM commits - human commits bypass this entirely.

import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import {
	log,
	logError,
	deny,
	setSessionId,
	getSessionId,
	colors,
} from "./lib/logger.js";
import { readState } from "./lib/state.js";

interface HookInput {
	tool_input?: {
		command?: string;
	};
	cwd?: string;
	session_id?: string;
}

interface ClaudeMdResult {
	content: string;
	path: string;
}

function findClaudeMd(dir: string): ClaudeMdResult | undefined {
	while (dir !== "/") {
		const path = join(dir, "CLAUDE.md");
		try {
			return { content: readFileSync(path, "utf8"), path };
		} catch {
			dir = dirname(dir);
		}
	}
}

// Extract effective cwd from command if it starts with "cd <dir> &&"
function getEffectiveCwd(command: string, baseCwd: string): string {
	// Match patterns like: cd foo && ..., cd ./foo && ..., cd "foo bar" && ...
	const cdMatch = command.match(/^cd\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s*&&/);
	if (cdMatch) {
		const targetDir = cdMatch[1] || cdMatch[2] || cdMatch[3];
		return resolve(baseCwd, targetDir);
	}
	return baseCwd;
}

// Find git root from a directory using git rev-parse
function findGitRoot(dir: string): string | undefined {
	const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
		cwd: dir,
		encoding: "utf8",
	});
	if (result.status === 0 && result.stdout) {
		return result.stdout.trim();
	}
	return undefined;
}

// Extract git -C path from command if present (git -C /path commit ...)
function extractGitCPath(command: string): string | undefined {
	const match = command.match(/git\s+-C\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
	if (match) {
		return match[1] || match[2] || match[3];
	}
	return undefined;
}

// Wrap everything in try-catch for global error handling
try {
	// Parse hook input (handle empty stdin gracefully)
	const stdin = readFileSync(0, "utf8").trim();
	if (!stdin) {
		process.exit(0);
	}
	const data: HookInput = JSON.parse(stdin);
	const command = data.tool_input?.command || "";
	const baseCwd = data.cwd || process.cwd();
	setSessionId(data.session_id);

	// Determine effective cwd: check cd pattern, git -C flag, or use baseCwd
	let cwd = getEffectiveCwd(command, baseCwd);
	const gitCPath = extractGitCPath(command);
	if (gitCPath) {
		cwd = resolve(baseCwd, gitCPath);
	}

	// Verify we're in a git repo, find the actual git root
	const gitRoot = findGitRoot(cwd);
	if (!gitRoot) {
		// Not in a git repo - can't validate, exit silently
		process.exit(0);
	}
	if (gitRoot !== cwd) {
		cwd = gitRoot;
	}

	// Only intercept git commit commands
	if (!command.includes("git commit")) {
		process.exit(0);
	}

	// Check state-based mode
	const state = readState();
	const commitMode = state.validateCommit.mode;

	if (commitMode === "off") {
		log("SKIP", "Commit validation disabled via state (mode=off)");
		process.exit(0);
	}

	const cwdNote = cwd !== baseCwd ? ` (resolved from: ${baseCwd})` : '';
	log("INFO", `Validating commit in: ${cwd}${cwdNote} (mode=${commitMode})\n  command: ${command.slice(0, 200)}`);

	// Check if command includes "git add" - if so, files aren't staged yet
	const includesGitAdd = command.includes("git add");

	let files: string[];
	let diffOutput: string;

	if (includesGitAdd) {
		// Command will stage files before commit - check what WILL be staged
		// For "git add -A" or "git add .", get all modified/untracked files
		const status = spawnSync("git", ["status", "--porcelain"], {
			cwd,
			encoding: "utf8",
		});
		const rawLines = status.stdout.trim().split("\n").filter(Boolean);

		files = rawLines.map((line: string) => {
			// Git porcelain format: XY PATH or XY ORIG -> PATH (for renames)
			// Remove 2 status chars + whitespace, handling variable spacing
			const path = line.replace(/^..\s+/, "");
			// Handle renames: "old -> new" - take the new path
			const arrowIdx = path.indexOf(" -> ");
			return arrowIdx >= 0 ? path.substring(arrowIdx + 4) : path;
		});

		// Get diff of all changes (staged + unstaged)
		const diff = spawnSync("git", ["diff", "HEAD"], { cwd, encoding: "utf8" });
		diffOutput = diff.stdout;
	} else {
		// Files already staged - check currently staged files
		const staged = spawnSync("git", ["diff", "--cached", "--name-only"], {
			cwd,
			encoding: "utf8",
		});
		files = staged.stdout.trim().split("\n").filter(Boolean);

		const diff = spawnSync("git", ["diff", "--cached"], {
			cwd,
			encoding: "utf8",
		});
		diffOutput = diff.stdout;
	}

	if (files.length === 0) {
		log("SKIP", `No files to validate (cwd: ${cwd})`);
		process.exit(0);
	}

	// Find CLAUDE.md
	const claudeMd = findClaudeMd(cwd);
	if (!claudeMd) {
		log("SKIP", `No CLAUDE.md found (searched from: ${cwd})`);
		process.exit(0);
	}
	const { content: rules, path: claudeMdPath } = claudeMd;

	// Extract commit message to check for pleas
	const commitMsgMatch = command.match(
		/-m\s+["']([^"']+)["']|--message[=\s]+["']([^"']+)["']/,
	);
	const commitMessage = commitMsgMatch
		? commitMsgMatch[1] || commitMsgMatch[2]
		: "";

	// Build prompt with full context
	const prompt = `You are a commit validator. You MUST respond with ONLY a JSON object, no other text.

Valid responses:
{"decision":"ACK"}
{"decision":"NACK","reason":"one sentence explanation"}

Validate this commit against CLAUDE.md rules:

Files: ${files.join(", ")}

Diff:
${diffOutput}

Commit message: ${commitMessage}

CLAUDE.md:
${rules}

Rules:
1. Enforce CLAUDE.md strictly
2. "plea: <reason>" is ONLY valid for: files that must be committed together for coherence (e.g., rename across files)
3. REJECT pleas for: coverage, tests, branches, else paths, "100%", or any test-related justification
4. NACK for: untested code paths, skipped tests, rule bypasses, coverage-chasing pleas

RESPOND WITH JSON ONLY - NO PROSE, NO MARKDOWN, NO EXPLANATION OUTSIDE THE JSON:`;

	// Call Claude to validate
	const { stdout, status } = spawnSync(
		"claude",
		[
			"-p",
			prompt,
			"--output-format",
			"json",
			"--max-turns",
			"3",
			"--allowedTools",
			"",
		],
		{ encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
	);

	if (status !== 0) {
		log("ERROR", `Claude CLI failed with exit code ${status}, stdout: ${stdout?.slice(0, 500)}`);
		deny("Claude CLI failed - cannot validate commit. Check if 'claude' CLI is installed.");
		process.exit(0);
	}

	// Parse response
	let resultText: string;
	try {
		const outer = JSON.parse(stdout);
		if (outer.result === undefined || outer.result === null) {
			log("ERROR", `Claude response missing result field. Got: ${JSON.stringify(outer).slice(0, 500)}`);
			deny("Claude response invalid - cannot validate commit.");
			log("DENIED", "Sent denial for invalid Claude response");
			process.exit(0);
		}
		resultText =
			typeof outer.result === "string"
				? outer.result
				: JSON.stringify(outer.result);
	} catch (e) {
		log("ERROR", `Failed to parse Claude response: ${e}`);
		deny("Failed to parse Claude response - cannot validate commit.");
		process.exit(0);
	}

	// Try to extract JSON from response - handle prose responses that contain JSON
	// First try to find a JSON object with decision field
	const jsonMatch = resultText!.match(/\{[^{}]*"decision"\s*:\s*"(ACK|NACK)"[^{}]*\}/);

	let decision: string;
	let reason: string | undefined;

	if (jsonMatch) {
		// Found JSON object - extract decision and reason
		const jsonStr = jsonMatch[0];
		decision = jsonMatch[1];
		const reasonMatch = jsonStr.match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/);
		reason = reasonMatch ? reasonMatch[1].replace(/\\"/g, '"') : undefined;
	} else {
		// No JSON found - check for clear ACK/NACK keywords as fallback
		const hasNack = /\bNACK\b/i.test(resultText!) || /\bviolation\b/i.test(resultText!) || /\buntested\b/i.test(resultText!);
		const hasAck = /\bACK\b/i.test(resultText!) && !hasNack;

		if (hasAck) {
			decision = "ACK";
			reason = undefined;
		} else if (hasNack) {
			decision = "NACK";
			// Extract first sentence as reason
			const firstSentence = resultText!.match(/^[^.!?]*[.!?]/)?.[0] || resultText!.slice(0, 100);
			reason = firstSentence.trim();
		} else {
			log("ERROR", `No valid ACK/NACK decision in response: ${resultText!.slice(0, 500)}`);
			deny("Could not validate commit - blocking by default. Check logs for details.");
			process.exit(0);
		}
	}

	if (decision === "NACK") {
		const coloredFiles = files
			.map((f) => `${colors.cyan}${f}${colors.reset}`)
			.join(", ");
		const italicReason = `${colors.italic}${colors.white}${reason}${colors.reset}`;
		const rulesHint = `${colors.dim}Please check the rules here before your next commit: ${colors.reset}${colors.cyan}${claudeMdPath}${colors.reset}`;

		if (commitMode === "warn") {
			log(
				"WARN",
				`${coloredFiles}\n  ${italicReason}\n  ${rulesHint}\n  ${colors.yellow}(warn mode - allowing commit)${colors.reset}`,
			);
		} else {
			log("NACK", `${coloredFiles}\n  ${italicReason}\n  ${rulesHint}`);
			deny(
				`CLAUDE.md violation: ${reason}\n\nPlease check the rules here before your next commit: ${claudeMdPath}`,
			);
			process.exit(0);
		}
	} else {
		const coloredFiles = files
			.map((f) => `${colors.cyan}${f}${colors.reset}`)
			.join(", ");
		log("ACK", coloredFiles);
	}
} catch (error) {
	logError(error, `session=${getSessionId() || "unknown"}`);
	// Don't block the commit on hook errors - just log and exit cleanly
	process.exit(0);
}
