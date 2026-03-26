#!/usr/bin/env npx tsx
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/worktree.ts
var worktree_exports = {};
__export(worktree_exports, {
  runCommand: () => runCommand,
  usage: () => usage
});
module.exports = __toCommonJS(worktree_exports);
var path5 = __toESM(require("node:path"));

// src/path-resolver.ts
var path2 = __toESM(require("node:path"));

// src/worktree-detector.ts
var fs = __toESM(require("node:fs"));
var path = __toESM(require("node:path"));
function isWorktree(cwd) {
  const dir = cwd ?? process.cwd();
  const gitPath = path.join(dir, ".git");
  try {
    const stat = fs.statSync(gitPath);
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
  const gitContent = fs.readFileSync(path.join(dir, ".git"), "utf-8").trim();
  const gitdir = gitContent.replace(/^gitdir:\s*/, "");
  return path.resolve(gitdir, "..", "..", "..");
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
  const claudeDir = path2.join(projectRoot, ".claude");
  const autoDir = path2.join(projectRoot, AUTO_DIR);
  return {
    projectRoot,
    claudeDir,
    autoDir,
    remindersDirs: [path2.join(pluginRoot, "reminders"), path2.join(autoDir, "reminders")],
    validatorsDirs: [path2.join(pluginRoot, "validators"), path2.join(autoDir, "validators")],
    isWorktree: worktreeDetected,
    mainRepoRoot
  };
}

// src/worktree-manager.ts
var import_node_child_process = require("node:child_process");
var fs3 = __toESM(require("node:fs"));
var path4 = __toESM(require("node:path"));

// src/worktree-state.ts
var fs2 = __toESM(require("node:fs"));
var path3 = __toESM(require("node:path"));
function createWorktreeState(autoDir) {
  if (!fs2.existsSync(autoDir)) {
    fs2.mkdirSync(autoDir, { recursive: true });
  }
  const stateFile = path3.join(autoDir, ".worktrees.json");
  function read() {
    if (!fs2.existsSync(stateFile)) {
      return { worktrees: {} };
    }
    const content = fs2.readFileSync(stateFile, "utf-8");
    return JSON.parse(content);
  }
  function write(state) {
    fs2.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}
`);
  }
  function addWorktree(info) {
    const state = read();
    state.worktrees[info.id] = info;
    write(state);
  }
  function removeWorktree(id) {
    const state = read();
    delete state.worktrees[id];
    write(state);
  }
  function updateWorktree(id, updates) {
    const state = read();
    const existing = state.worktrees[id];
    if (existing) {
      state.worktrees[id] = { ...existing, ...updates };
      write(state);
    }
  }
  function getWorktree(id) {
    const state = read();
    return state.worktrees[id];
  }
  return {
    read,
    write,
    addWorktree,
    removeWorktree,
    updateWorktree,
    getWorktree
  };
}

// src/worktree-manager.ts
var ADJECTIVES = [
  "swift",
  "calm",
  "bold",
  "warm",
  "cool",
  "keen",
  "fair",
  "wise",
  "kind",
  "pure",
  "deep",
  "soft",
  "dark",
  "wild",
  "tall",
  "fast",
  "gold",
  "blue",
  "red",
  "jade",
  "iron",
  "oak",
  "pine",
  "fern",
  "mint",
  "sage",
  "dawn",
  "dusk",
  "noon",
  "star",
  "moon",
  "sun",
  "rain",
  "snow",
  "wind",
  "fire",
  "sand",
  "clay",
  "ruby",
  "opal",
  "silk",
  "lace",
  "reef",
  "cove",
  "peak",
  "vale",
  "glen",
  "moor",
  "rift",
  "arch"
];
var NOUNS = [
  "fox",
  "owl",
  "elk",
  "bee",
  "ant",
  "ray",
  "bay",
  "elm",
  "ash",
  "yew",
  "fin",
  "gem",
  "orb",
  "arc",
  "hub",
  "den",
  "web",
  "pod",
  "rod",
  "cap",
  "jar",
  "key",
  "map",
  "net",
  "pen",
  "rig",
  "tap",
  "vat",
  "axe",
  "bow",
  "cog",
  "dam",
  "eel",
  "fig",
  "gum",
  "hex",
  "imp",
  "jig",
  "kit",
  "log",
  "mat",
  "nib",
  "oat",
  "peg",
  "ram",
  "sap",
  "tin",
  "urn",
  "vim",
  "wax"
];
function generateWorktreePath(mainRepoPath, randomFn = Math.random) {
  const parentName = path4.basename(mainRepoPath);
  const adjective = ADJECTIVES[Math.floor(randomFn() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(randomFn() * NOUNS.length)];
  return path4.resolve(mainRepoPath, "..", `${parentName}-${adjective}-${noun}`);
}
function generateBranchName(featureName) {
  const slug = featureName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `worktree/${slug}`;
}
var defaultExecutor = (args, cwd) => {
  return (0, import_node_child_process.execSync)(["git", ...args].join(" "), { cwd, encoding: "utf-8" }).trim();
};
function createWorktreeManager(mainRepoPath, autoDir, executor = defaultExecutor) {
  const state = createWorktreeState(autoDir);
  let idCounter = 0;
  function create(branch, options) {
    const worktreePath = options?.path ?? generateWorktreePath(mainRepoPath);
    const baseBranch = options?.baseBranch ?? "main";
    executor(["worktree", "add", "-b", branch, worktreePath, baseBranch], mainRepoPath);
    const info = {
      id: `wt-${Date.now()}-${idCounter++}`,
      path: worktreePath,
      branch,
      baseBranch,
      status: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    state.addWorktree(info);
    return info;
  }
  function list() {
    return Object.values(state.read().worktrees);
  }
  function remove(id) {
    const info = state.getWorktree(id);
    if (info) {
      executor(["worktree", "remove", "--force", info.path], mainRepoPath);
      state.removeWorktree(id);
    }
  }
  function isHealthy(id) {
    const info = state.getWorktree(id);
    if (!info) {
      return false;
    }
    return fs3.existsSync(info.path);
  }
  return { create, list, remove, isHealthy };
}

// src/worktree-orchestrator.ts
function generateMergeCommand(worktree) {
  return `git merge ${worktree.branch}`;
}
function formatWorktreeStatus(worktrees) {
  if (worktrees.length === 0) {
    return "No active worktrees.";
  }
  const lines = worktrees.map((wt) => `- ${wt.id}: ${wt.branch} at ${wt.path} (${wt.status})`);
  return `Active Worktrees:
${lines.join("\n")}`;
}

// scripts/worktree.ts
function derivePluginRoot() {
  return path5.resolve(__dirname, "..", "..", "..");
}
function usage() {
  return `Usage: /claude-auto:worktree <command> [args]

Commands:
  list                                    Show all tracked worktrees and their status
  status <id>                             Check health of a specific worktree
  create <branch> [--base <branch>] [--path <path>]  Create a new worktree
  remove <id>                             Remove a worktree and clean up
  merge <id>                              Show merge command for worktree branch`;
}
function runCommand(subcommand, args, manager) {
  switch (subcommand) {
    case "list": {
      const worktrees = manager.list();
      return { output: formatWorktreeStatus(worktrees) };
    }
    case "status": {
      const id = args[0];
      if (!id) {
        return { output: "Usage: worktree status <id>", error: true };
      }
      const healthy = manager.isHealthy(id);
      return { output: healthy ? `Worktree ${id} is healthy.` : `Worktree ${id} is not found or unhealthy.` };
    }
    case "create": {
      const branch = args[0];
      if (!branch) {
        return { output: "Usage: worktree create <branch> [--base <branch>] [--path <path>]", error: true };
      }
      const baseIdx = args.indexOf("--base");
      const pathIdx = args.indexOf("--path");
      const baseBranch = baseIdx >= 0 ? args[baseIdx + 1] : void 0;
      const worktreePath = pathIdx >= 0 ? args[pathIdx + 1] : void 0;
      const branchName = generateBranchName(branch);
      const info = manager.create(branchName, { baseBranch, path: worktreePath });
      return {
        output: `Created worktree:
  ID: ${info.id}
  Branch: ${info.branch}
  Path: ${info.path}
  Base: ${info.baseBranch}`
      };
    }
    case "remove": {
      const id = args[0];
      if (!id) {
        return { output: "Usage: worktree remove <id>", error: true };
      }
      manager.remove(id);
      return { output: `Removed worktree: ${id}` };
    }
    case "merge": {
      const id = args[0];
      if (!id) {
        return { output: "Usage: worktree merge <id>", error: true };
      }
      const worktrees = manager.list();
      const wt = worktrees.find((w) => w.id === id);
      if (!wt) {
        return { output: `Worktree ${id} not found.` };
      }
      return { output: `To merge: ${generateMergeCommand(wt)}` };
    }
    default:
      return { output: usage() };
  }
}
async function main() {
  const argv = process.argv.slice(2);
  const subcommand = argv[0];
  const rest = argv.slice(1);
  const paths = await resolvePathsFromEnv(derivePluginRoot());
  const manager = createWorktreeManager(paths.projectRoot, paths.autoDir);
  const result = runCommand(subcommand, rest, manager);
  if (result.error) {
    console.error(result.output);
    process.exit(1);
  }
  console.log(result.output);
}
var isDirectRun = !process.env.VITEST;
if (isDirectRun) {
  main();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runCommand,
  usage
});
