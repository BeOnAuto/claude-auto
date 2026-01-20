import { debugLog } from '../debug-logger.js';
import { isDenied, loadDenyPatterns } from '../deny-list.js';

type ToolInput = Record<string, unknown>;

type HookResult = {
  decision: 'block' | 'allow';
  reason?: string;
};

export function handlePreToolUse(
  claudeDir: string,
  toolInput: ToolInput
): HookResult {
  const patterns = loadDenyPatterns(claudeDir);
  const filePath = toolInput.file_path as string;

  if (isDenied(filePath, patterns)) {
    debugLog(claudeDir, 'pre-tool-use', `${filePath} blocked by deny-list`);
    return {
      decision: 'block',
      reason: `Path ${filePath} is denied by ketchup deny-list`,
    };
  }

  debugLog(claudeDir, 'pre-tool-use', `${filePath} allowed`);
  return { decision: 'allow' };
}
