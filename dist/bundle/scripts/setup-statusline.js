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

// scripts/setup-statusline.ts
var setup_statusline_exports = {};
__export(setup_statusline_exports, {
  runSetupStatusLine: () => runSetupStatusLine
});
module.exports = __toCommonJS(setup_statusline_exports);
var os = __toESM(require("node:os"));
var path2 = __toESM(require("node:path"));

// src/statusline-detector.ts
var fs = __toESM(require("node:fs"));
var path = __toESM(require("node:path"));
function isStatusLineConfigured(settingsPath) {
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const content = fs.readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(content);
    return "statusLine" in settings;
  } catch {
    return false;
  }
}
function setupStatusLine(scriptSource, scriptDest, settingsPath) {
  fs.mkdirSync(path.dirname(scriptDest), { recursive: true });
  fs.copyFileSync(scriptSource, scriptDest);
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
    }
  }
  settings.statusLine = { type: "command", command: `sh ${scriptDest}` };
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// scripts/setup-statusline.ts
function runSetupStatusLine(pluginRoot2, homeDir) {
  const settingsPath = path2.join(homeDir, ".claude", "settings.json");
  const scriptSource = path2.join(pluginRoot2, "scripts", "statusline.sh");
  const scriptDest = path2.join(homeDir, ".claude", "statusline-command.sh");
  if (isStatusLineConfigured(settingsPath)) {
    return { status: "already-configured", settingsPath };
  }
  setupStatusLine(scriptSource, scriptDest, settingsPath);
  return { status: "configured", scriptDest, settingsPath };
}
var pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
if (pluginRoot) {
  const result = runSetupStatusLine(pluginRoot, os.homedir());
  console.log(JSON.stringify(result));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runSetupStatusLine
});
