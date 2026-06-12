import type { SessionEvent } from './Timeline';

export interface TreeNode {
  event: SessionEvent;
  children: TreeNode[];
}

function findParent(event: SessionEvent, byToolUseId: Map<string, TreeNode>): TreeNode | undefined {
  if (event.type === 'ToolInvocationSucceeded' || event.type === 'ToolInvocationFailed') {
    return byToolUseId.get(event.toolUseId);
  }
  if (event.type === 'SubagentProgressed') {
    return byToolUseId.get(event.parentToolUseId);
  }
  return undefined;
}

export function buildEventTree(events: SessionEvent[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const byToolUseId = new Map<string, TreeNode>();

  for (const event of events) {
    const node: TreeNode = { event, children: [] };
    const parent = findParent(event, byToolUseId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
    if (event.type === 'ToolInvoked') {
      byToolUseId.set(event.toolUseId, node);
    }
  }

  return roots;
}
