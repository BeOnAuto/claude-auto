// Shared logging utilities for Claude Code hooks

import { appendFileSync, mkdirSync, readdirSync, writeSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_DIR = join(__dirname, "..", "..", "logs");
const ERR_LOG = join(LOG_DIR, "err.log");

export const colors = {
	reset: "\x1b[0m",
	dim: "\x1b[2m",
	bold: "\x1b[1m",
	italic: "\x1b[3m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	pink: "\x1b[35m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	white: "\x1b[97m",
	magenta: "\x1b[35m",
} as const;

export type LogLevel =
	| "ACK"
	| "NACK"
	| "ERROR"
	| "WARN"
	| "SKIP"
	| "INFO"
	| "DENIED"
	| "CONTINUE";

const levelColors: Record<LogLevel, string> = {
	ACK: `${colors.bold}${colors.green}`,
	NACK: `${colors.bold}${colors.red}`,
	ERROR: `${colors.red}`,
	SKIP: `${colors.yellow}`,
	WARN: `${colors.pink}`,
	INFO: `${colors.dim}`,
	DENIED: `${colors.bold}${colors.magenta}`,
	CONTINUE: `${colors.bold}${colors.cyan}`,
};

let sessionId: string | undefined;
let logFilePath: string | undefined;

export function setSessionId(id: string | undefined): void {
	sessionId = id;
}

export function getSessionId(): string | undefined {
	return sessionId;
}

export function getLogDir(): string {
	return LOG_DIR;
}

export function getProjectDir(): string {
	// lib/ -> scripts/ -> .claude/ -> project root
	return dirname(dirname(dirname(__dirname)));
}

export function logError(error: unknown, context?: string): void {
	try {
		mkdirSync(LOG_DIR, { recursive: true });
	} catch {}
	const timestamp = new Date().toISOString();
	const errorMsg =
		error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
	const contextStr = context ? ` [${context}]` : "";
	appendFileSync(ERR_LOG, `[${timestamp}]${contextStr} ${errorMsg}\n\n`);
}

function getLogFile(): string {
	if (logFilePath) {
		return logFilePath;
	}

	try {
		mkdirSync(LOG_DIR, { recursive: true });
	} catch {}

	if (!sessionId) {
		logFilePath = join(LOG_DIR, "unknown.log");
		return logFilePath;
	}

	const prefix = sessionId.slice(0, 8);

	// Look for existing log file for this session (created by session-start hook)
	try {
		const files = readdirSync(LOG_DIR);
		const existing = files.find(
			(f) => f.startsWith(`${prefix}-`) && f.endsWith(".log"),
		);
		if (existing) {
			logFilePath = join(LOG_DIR, existing);
			return logFilePath;
		}
	} catch {
		// Directory might not exist or be empty
	}

	// Fallback: create log file if session-start hook didn't run
	const timestamp = new Date()
		.toISOString()
		.replace(/:/g, "-")
		.replace(/\.\d{3}Z$/, "");
	const filename = `${prefix}-${timestamp}.log`;
	logFilePath = join(LOG_DIR, filename);
	appendFileSync(logFilePath, `session: ${sessionId}\n\n`);

	return logFilePath;
}

export function log(level: LogLevel, message: string): void {
	const timestamp = new Date().toISOString();
	const coloredLevel = `${levelColors[level]}${level}${colors.reset}`;
	const dimTimestamp = `${colors.dim}[${timestamp}]${colors.reset}`;
	const logFile = getLogFile();
	appendFileSync(logFile, `${dimTimestamp} ${coloredLevel}: ${message}\n`);
}

export function deny(reason: string): void {
	// Use writeSync to ensure output is flushed before any process.exit()
	const output = JSON.stringify({
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "deny",
			permissionDecisionReason: reason,
		},
	}) + "\n";
	writeSync(1, output);
}

export function blockContinue(reason: string): void {
	// Use writeSync to ensure output is flushed before any process.exit()
	const output = JSON.stringify({
		decision: "block",
		reason: reason,
	}) + "\n";
	writeSync(1, output);
}
