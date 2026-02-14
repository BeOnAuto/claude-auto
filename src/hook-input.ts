export type HookInput = {
  session_id: string;
  cwd?: string;
  hook_event_name: string;
  prompt?: string;
  tool_input?: Record<string, unknown>;
  agent_type?: string;
};

export function parseHookInput(json: string): HookInput {
  return JSON.parse(json) as HookInput;
}
