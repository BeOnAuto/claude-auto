#!/usr/bin/env npx tsx
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/auto-continue.ts
var fs6 = __toESM(require("node:fs"));

// src/activity-logger.ts
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
function matchesFilter(hookName, message) {
  const filter = process.env.KETCHUP_LOG;
  if (!filter) {
    return true;
  }
  const patterns = filter.split(",").map((p) => p.trim());
  const includes = patterns.filter((p) => !p.startsWith("-"));
  const excludes = patterns.filter((p) => p.startsWith("-")).map((p) => p.slice(1));
  const searchText = `${hookName}: ${message}`;
  const excluded = excludes.some((pattern) => searchText.includes(pattern));
  if (excluded) {
    return false;
  }
  if (includes.length === 0 || includes.includes("*")) {
    return true;
  }
  return includes.some((pattern) => searchText.includes(pattern));
}
function activityLog(autoDir, sessionId, hookName, message) {
  if (!matchesFilter(hookName, message)) {
    return;
  }
  const logsDir = import_node_path.default.join(autoDir, "logs");
  if (!import_node_fs.default.existsSync(logsDir)) {
    import_node_fs.default.mkdirSync(logsDir, { recursive: true });
  }
  const logPath = import_node_path.default.join(logsDir, "activity.log");
  const now = /* @__PURE__ */ new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timestamp = `${month}-${day} ${hours}:${minutes}:${seconds}`;
  const shortSessionId = sessionId.slice(-8);
  const entry = `${timestamp} [${shortSessionId}] ${hookName}: ${message}
`;
  import_node_fs.default.appendFileSync(logPath, entry);
}

// src/hook-logger.ts
var fs2 = __toESM(require("node:fs"));
var path2 = __toESM(require("node:path"));
function sanitizeForFilename(hookName) {
  return hookName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}
function writeHookLog(autoDir, entry) {
  const logsDir = path2.join(autoDir, "logs", "hooks");
  if (!fs2.existsSync(logsDir)) {
    fs2.mkdirSync(logsDir, { recursive: true });
  }
  const sanitizedName = sanitizeForFilename(entry.hookName);
  const logPath = path2.join(logsDir, `${sanitizedName}.log`);
  const lines = [];
  lines.push(`=== ${entry.hookName} hook log ===`);
  lines.push(`Timestamp: ${entry.timestamp}`);
  if (entry.durationMs !== void 0) {
    lines.push(`Duration: ${entry.durationMs}ms`);
  }
  lines.push("");
  lines.push("--- Input ---");
  lines.push(JSON.stringify(entry.input, null, 2));
  lines.push("");
  if (entry.resolvedPaths) {
    lines.push("--- Resolved Paths ---");
    for (const [key, value] of Object.entries(entry.resolvedPaths)) {
      lines.push(`  ${key}: ${String(value)}`);
    }
    lines.push("");
  }
  if (entry.reminderFiles) {
    lines.push(`--- Reminder Files Found (${entry.reminderFiles.length}) ---`);
    for (const file of entry.reminderFiles) {
      lines.push(`  ${file}`);
    }
    lines.push("");
  }
  if (entry.matchedReminders) {
    lines.push(`--- Matched Reminders (${entry.matchedReminders.length}) ---`);
    for (const r of entry.matchedReminders) {
      lines.push(`  ${r.name} (priority: ${r.priority})`);
    }
    lines.push("");
  }
  if (entry.error) {
    lines.push("--- Error ---");
    lines.push(entry.error);
    lines.push("");
  }
  lines.push("--- Output ---");
  lines.push(JSON.stringify(entry.output, null, 2));
  lines.push("");
  fs2.appendFileSync(logPath, `${lines.join("\n")}
`);
}

// src/hook-state.ts
var fs3 = __toESM(require("node:fs"));
var path3 = __toESM(require("node:path"));
var DEFAULT_HOOK_STATE = {
  autoContinue: {
    mode: "smart",
    maxIterations: 0,
    skipModes: ["plan"]
  },
  validateCommit: {
    mode: "strict",
    batchCount: 3
  },
  denyList: {
    enabled: true,
    extraPatterns: []
  },
  promptReminder: {
    enabled: true
  },
  subagentHooks: {
    validateCommitOnExplore: false,
    validateCommitOnWork: true,
    validateCommitOnUnknown: true
  },
  overrides: {
    validators: {},
    reminders: {}
  },
  worktree: {
    enabled: true,
    autoCleanup: true
  }
};
function createHookState(autoDir) {
  if (!fs3.existsSync(autoDir)) {
    fs3.mkdirSync(autoDir, { recursive: true });
  }
  const stateFile = path3.join(autoDir, ".claude.hooks.json");
  function read() {
    if (!fs3.existsSync(stateFile)) {
      const isPluginMode = !!process.env.CLAUDE_PLUGIN_ROOT;
      const initialState = isPluginMode ? { ...DEFAULT_HOOK_STATE, firstSetupRequired: true } : { ...DEFAULT_HOOK_STATE };
      fs3.writeFileSync(stateFile, `${JSON.stringify(initialState, null, 2)}
`);
      return JSON.parse(JSON.stringify(initialState));
    }
    const content = fs3.readFileSync(stateFile, "utf-8");
    const partial = JSON.parse(content);
    return {
      ...partial.firstSetupRequired !== void 0 ? { firstSetupRequired: partial.firstSetupRequired } : {},
      autoContinue: { ...DEFAULT_HOOK_STATE.autoContinue, ...partial.autoContinue },
      validateCommit: { ...DEFAULT_HOOK_STATE.validateCommit, ...partial.validateCommit },
      denyList: { ...DEFAULT_HOOK_STATE.denyList, ...partial.denyList },
      promptReminder: { ...DEFAULT_HOOK_STATE.promptReminder, ...partial.promptReminder },
      subagentHooks: { ...DEFAULT_HOOK_STATE.subagentHooks, ...partial.subagentHooks },
      overrides: {
        validators: { ...DEFAULT_HOOK_STATE.overrides.validators, ...partial.overrides?.validators },
        reminders: { ...DEFAULT_HOOK_STATE.overrides.reminders, ...partial.overrides?.reminders }
      },
      worktree: { ...DEFAULT_HOOK_STATE.worktree, ...partial.worktree }
    };
  }
  function write(state) {
    fs3.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}
`);
  }
  function update(updates) {
    const current = read();
    const newState = {
      ...current,
      ...updates,
      autoContinue: { ...current.autoContinue, ...updates.autoContinue },
      validateCommit: { ...current.validateCommit, ...updates.validateCommit },
      denyList: { ...current.denyList, ...updates.denyList },
      promptReminder: { ...current.promptReminder, ...updates.promptReminder },
      subagentHooks: { ...current.subagentHooks, ...updates.subagentHooks },
      overrides: {
        validators: { ...current.overrides.validators, ...updates.overrides?.validators },
        reminders: { ...current.overrides.reminders, ...updates.overrides?.reminders }
      },
      worktree: { ...current.worktree, ...updates.worktree }
    };
    write(newState);
    return newState;
  }
  function exists() {
    return fs3.existsSync(stateFile);
  }
  return {
    exists,
    read,
    write,
    update
  };
}

// src/hooks/auto-continue.ts
function handleStop(autoDir, input2) {
  const stateManager = createHookState(autoDir);
  const state = stateManager.read();
  const { mode, skipModes } = state.autoContinue;
  if (mode === "off") {
    return { decision: "allow", reason: "auto-continue disabled" };
  }
  if (input2.stop_hook_active) {
    return { decision: "allow", reason: "stop hook already active" };
  }
  const modesToSkip = skipModes;
  if (input2.permission_mode && modesToSkip.includes(input2.permission_mode)) {
    return { decision: "allow", reason: `skipping mode: ${input2.permission_mode}` };
  }
  return { decision: "allow", reason: "no work remaining" };
}

// src/path-resolver.ts
var path5 = __toESM(require("node:path"));

// src/worktree-detector.ts
var fs4 = __toESM(require("node:fs"));
var path4 = __toESM(require("node:path"));
function isWorktree(cwd) {
  const dir = cwd ?? process.cwd();
  const gitPath = path4.join(dir, ".git");
  try {
    const stat = fs4.statSync(gitPath);
    return stat.isFile();
  } catch {
    return false;
  }
}
function getMainRepoPath(cwd) {
  const dir = cwd ?? process.cwd();
  if (!isWorktree(dir)) {
    return null;
  }
  const gitContent = fs4.readFileSync(path4.join(dir, ".git"), "utf-8").trim();
  const gitdir = gitContent.replace(/^gitdir:\s*/, "");
  return path4.resolve(gitdir, "..", "..", "..");
}

// src/path-resolver.ts
var AUTO_DIR = ".claude-auto";
async function resolvePathsFromEnv(explicitPluginRoot) {
  const pluginRoot = explicitPluginRoot || process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) {
    throw new Error("CLAUDE_PLUGIN_ROOT must be set. Claude Auto requires plugin mode.");
  }
  const projectRoot = process.cwd();
  const worktreeDetected = isWorktree(projectRoot);
  const mainRepoRoot = worktreeDetected ? getMainRepoPath(projectRoot) : null;
  const claudeDir = path5.join(projectRoot, ".claude");
  const autoDir = path5.join(projectRoot, AUTO_DIR);
  return {
    projectRoot,
    claudeDir,
    autoDir,
    remindersDirs: [path5.join(pluginRoot, "reminders"), path5.join(autoDir, "reminders")],
    validatorsDirs: [path5.join(pluginRoot, "validators"), path5.join(autoDir, "validators")],
    isWorktree: worktreeDetected,
    mainRepoRoot
  };
}

// src/plugin-debug.ts
var fs5 = __toESM(require("node:fs"));
var path6 = __toESM(require("node:path"));
function logPluginDiagnostics(hookName, paths) {
  const isPluginMode = !!process.env.CLAUDE_PLUGIN_ROOT;
  const isDebug = !!process.env.CLAUDE_AUTO_DEBUG;
  if (!isPluginMode && !isDebug) {
    return;
  }
  const mode = isPluginMode ? "plugin" : "legacy";
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const lines = [
    `[${timestamp}] ${hookName} hook fired (${mode} mode)`,
    `  CLAUDE_PLUGIN_ROOT: ${process.env.CLAUDE_PLUGIN_ROOT ?? "(not set)"}`,
    `  CLAUDE_PLUGIN_DATA: ${process.env.CLAUDE_PLUGIN_DATA ?? "(not set)"}`,
    `  projectRoot: ${paths.projectRoot}`,
    `  autoDir: ${paths.autoDir}`,
    `  validatorsDirs: ${JSON.stringify(paths.validatorsDirs)}`,
    `  remindersDirs: ${JSON.stringify(paths.remindersDirs)}`,
    ""
  ];
  const message = lines.join("\n");
  if (isDebug) {
    console.error(message);
  }
  const logsDir = path6.join(paths.autoDir, "logs");
  fs5.mkdirSync(logsDir, { recursive: true });
  fs5.appendFileSync(path6.join(logsDir, "plugin-debug.log"), message);
}

// scripts/auto-continue.ts
var stdin = fs6.readFileSync(0, "utf8").trim();
if (!stdin) {
  process.exit(0);
}
var input = JSON.parse(stdin);
var startTime = Date.now();
(async () => {
  const paths = await resolvePathsFromEnv();
  logPluginDiagnostics("Stop", paths);
  try {
    const result = handleStop(paths.autoDir, input);
    const output = result.decision === "block" ? { decision: "block", reason: result.reason } : null;
    writeHookLog(paths.autoDir, {
      hookName: "auto-continue",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      input,
      output: output ?? { decision: result.decision, reason: result.reason },
      durationMs: Date.now() - startTime
    });
    if (output) {
      console.log(JSON.stringify(output));
    }
    process.exit(0);
  } catch (err) {
    activityLog(paths.autoDir, input.session_id ?? "unknown", "auto-continue", `error: ${String(err)}`);
    writeHookLog(paths.autoDir, {
      hookName: "auto-continue",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      input,
      output: null,
      error: String(err),
      durationMs: Date.now() - startTime
    });
    console.error("auto-continue hook failed:", err);
    process.exit(1);
  }
})();
