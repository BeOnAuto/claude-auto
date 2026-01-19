#!/usr/bin/env tsx

import { readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

const LOGS_DIR = join(import.meta.dirname, "..", "logs");
const DEFAULT_MINUTES = 60;

function cleanLogs(maxAgeMinutes: number = DEFAULT_MINUTES): {
	deleted: string[];
	kept: number;
} {
	const now = Date.now();
	const maxAgeMs = maxAgeMinutes * 60 * 1000;
	const deleted: string[] = [];
	let kept = 0;

	try {
		const files = readdirSync(LOGS_DIR);
		for (const file of files) {
			const filePath = join(LOGS_DIR, file);
			try {
				const stats = statSync(filePath);
				if (!stats.isFile()) continue;
				if (now - stats.mtimeMs > maxAgeMs) {
					unlinkSync(filePath);
					deleted.push(file);
				} else {
					kept++;
				}
			} catch {}
		}
	} catch {}

	return { deleted, kept };
}

const minutes = parseInt(process.argv[2], 10) || DEFAULT_MINUTES;
const { deleted, kept } = cleanLogs(minutes);
console.log(
	deleted.length > 0
		? `Deleted ${deleted.length} log file(s) older than ${minutes} minutes`
		: `No log files older than ${minutes} minutes`,
);
if (kept > 0) console.log(`Kept ${kept} recent file(s)`);
