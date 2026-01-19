#!/usr/bin/env tsx

// Auto-continue Stop hook: blocks LLM from stopping when there's more work to do.
// Uses ClueCollector to gather facts, then Claude CLI to make the decision.

import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
	log,
	logError,
	setSessionId,
	blockContinue,
	getProjectDir,
	colors,
} from "./lib/logger.js";
import { collectClues, ClueCollectorResult } from "./lib/clue-collector.js";
import { readState, incrementIteration, resetIteration } from "./lib/state.js";

interface StopHookInput {
	session_id?: string;
	transcript_path?: string;
	stop_hook_active?: boolean;
	cwd?: string;
	permission_mode?: string;
}

function getIncompleteBursts(planPath: string): {
	count: number;
	path: string;
	todoSection: string;
} {
	try {
		const content = readFileSync(planPath, "utf8");

		// Count ALL unchecked items in the entire file (any `- [ ]` pattern)
		const allUnchecked = content.match(/- \[ \]/g);
		const count = allUnchecked?.length || 0;

		if (count === 0) {
			return { count: 0, path: planPath, todoSection: "" };
		}

		// Extract first TODO section for context (flexible header level: ## or ###)
		const todoMatch = content.match(
			/#{2,3}\s*TODO[\s\S]*?(?=#{2,3}\s*DONE|#{2,3}\s*[A-Z]|$)/i,
		);
		const todoSection = todoMatch
			? todoMatch[0].slice(0, 500)
			: `${count} unchecked items found`;

		return { count, path: planPath, todoSection };
	} catch {
		return { count: 0, path: planPath, todoSection: "" };
	}
}

function buildPrompt(clues: ClueCollectorResult, ketchupInfo: string): string {
	const cluesList = clues.clues
		.map((c) => `[${c.timestamp}] [${c.type}] ${c.text}`)
		.join("\n\n");

	const chatsList = clues.lastChats
		.map((c) => `[${c.timestamp}]\nUser: ${c.user}\nAssistant: ${c.assistant}`)
		.join("\n\n---\n\n");

	return `You are deciding whether an AI coding assistant should CONTINUE working or STOP.

## Clues from Session Log (ordered by time):
${cluesList || "(no clues found)"}

## Last 5 Chat Exchanges:
${chatsList || "(no chats found)"}

## Ketchup Plans Status:
${ketchupInfo || "(no incomplete bursts found)"}

## Decision Criteria:
CONTINUE if:
- The assistant asked "would you like to continue?" or similar
- There are remaining bursts in ketchup-plan.md
- The assistant mentioned there's more work to do
- The last chat shows unfinished work

STOP if:
- All work appears complete
- The user said to stop or the task is done
- No signals of remaining work

Respond JSON only: {"decision":"CONTINUE","reason":"..."} or {"decision":"STOP","reason":"..."}`;
}

try {
	// Parse hook input (handle empty stdin gracefully)
	const stdin = readFileSync(0, "utf8").trim();
	if (!stdin) {
		// Empty stdin - Claude Code called hook without input, exit silently
		process.exit(0);
	}
	const data: StopHookInput = JSON.parse(stdin);
	setSessionId(data.session_id);

	const projectDir = getProjectDir();

	// Read state early so we can use skipModes
	const state = readState();
	const { mode, maxIterations, iteration, skipModes } = state.autoContinue;

	// Guard 0: Skip configured permission modes (default: plan only)
	const modesToSkip = skipModes ?? ["plan"];
	if (modesToSkip.includes(data.permission_mode || "")) {
		log(
			"INFO",
			`Skipping auto-continue (permission_mode=${data.permission_mode} in skipModes)`,
		);
		process.exit(0);
	}

	if (mode === "off") {
		log("INFO", "Auto-continue disabled via state (mode=off)");
		process.exit(0);
	}

	// Guard 2: Prevent infinite loops
	if (data.stop_hook_active) {
		log("INFO", "Stop hook already active, exiting to prevent loop");
		process.exit(0);
	}

	// Guard 3: Check iteration limit (for non-stop mode)
	if (mode === "non-stop" && maxIterations && maxIterations > 0) {
		if ((iteration || 0) >= maxIterations) {
			log(
				"INFO",
				`Iteration limit reached (${iteration}/${maxIterations}) - allowing stop`,
			);
			resetIteration();
			process.exit(0);
		}
	}

	// Non-stop mode: always continue (bypass Claude CLI, no transcript needed)
	if (mode === "non-stop") {
		const iter = incrementIteration();
		const maxStr =
			maxIterations && maxIterations > 0 ? `/${maxIterations}` : "/∞";
		log(
			"CONTINUE",
			`${colors.cyan}Non-stop mode - iteration ${iter}${maxStr}${colors.reset}`,
		);
		blockContinue(`Non-stop mode - iteration ${iter}${maxStr}`);
		process.exit(0);
	}

	// Smart mode: need session_id to calculate transcript path
	if (!data.session_id) {
		log("INFO", "No session_id provided");
		process.exit(0);
	}

	// Calculate transcript path from session_id (don't rely on input)
	const projectSlug = projectDir.replace(/\//g, "-");
	const homedir = process.env.HOME || "/tmp";
	const transcriptPath = join(
		homedir,
		".claude",
		"projects",
		projectSlug,
		`${data.session_id}.jsonl`,
	);

	// Smart mode: use Claude CLI to decide
	// Collect clues from session log (includes ketchup plan paths from tool calls)
	const clues = collectClues(transcriptPath);
	log("INFO", `Collected: ${clues.summary}`);

	// Build list of ketchup plans to check:
	// 1. Explicit paths from transcript (Read/Edit/Write calls or text mentions)
	// 2. Check working directories from transcript for ketchup-plan.md
	const planPathsToCheck = new Set<string>(clues.ketchupPlanPaths);

	// Check working directories (where Claude edited files) for ketchup plans
	for (const dir of clues.workingDirs) {
		// Check this dir and walk up to find ketchup-plan.md
		let checkDir = dir;
		for (let i = 0; i < 5 && checkDir && checkDir !== "/"; i++) {
			const planPath = join(checkDir, "ketchup-plan.md");
			if (existsSync(planPath)) {
				planPathsToCheck.add(planPath);
				break; // Found one, stop walking up
			}
			checkDir = join(checkDir, "..");
		}
	}

	// Check all found ketchup plans for incomplete bursts
	const ketchupInfoParts: string[] = [];
	let totalIncomplete = 0;

	for (const planPath of planPathsToCheck) {
		if (!existsSync(planPath)) continue;
		const { count, path, todoSection } = getIncompleteBursts(planPath);
		if (count > 0) {
			totalIncomplete += count;
			const relativePath = path.replace(projectDir + "/", "");
			ketchupInfoParts.push(
				`${relativePath}: ${count} incomplete bursts\n${todoSection}`,
			);
		}
	}

	const ketchupInfo =
		ketchupInfoParts.join("\n\n") ||
		"No ketchup plans found in session working directories, or all complete.";

	// If no clues and no incomplete bursts, allow stop
	if (clues.clues.length === 0 && totalIncomplete === 0) {
		log("INFO", "No clues or incomplete bursts in session - allowing stop");
		process.exit(0);
	}

	// Build prompt and call Claude CLI
	const prompt = buildPrompt(clues, ketchupInfo);

	const { stdout, status } = spawnSync(
		"claude",
		[
			"-p",
			prompt,
			"--output-format",
			"json",
			"--max-turns",
			"1",
			"--allowedTools",
			"",
		],
		{ encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
	);

	if (status !== 0) {
		log("ERROR", `Claude CLI failed with exit code ${status}`);
		process.exit(0);
	}

	// Parse response
	let resultText: string;
	try {
		const outer = JSON.parse(stdout);
		if (outer.result === undefined || outer.result === null) {
			log("ERROR", "Claude response missing result field");
			process.exit(0);
		}
		resultText =
			typeof outer.result === "string"
				? outer.result
				: JSON.stringify(outer.result);
	} catch (e) {
		log("ERROR", `Failed to parse Claude response: ${e}`);
		process.exit(0);
	}

	const match = resultText.match(
		/\{[^{}]*"decision"\s*:\s*"(CONTINUE|STOP)"[^{}]*\}/,
	);
	if (!match) {
		log("ERROR", "No valid CONTINUE/STOP decision in response");
		process.exit(0);
	}

	const { decision, reason } = JSON.parse(match[0]) as {
		decision: string;
		reason?: string;
	};

	if (decision === "CONTINUE") {
		const shortReason = reason ? reason.slice(0, 100) : "Work remaining";
		log("CONTINUE", `${colors.cyan}${shortReason}${colors.reset}`);
		blockContinue(shortReason);
	} else {
		log("INFO", `Allowing stop: ${reason || "Work complete"}`);
	}

	process.exit(0);
} catch (error) {
	logError(error, "auto-continue");
	process.exit(0); // Don't block on errors
}
