import { describe, expect, it } from 'vitest';

import { buildEventTree } from './event-tree';
import type { SessionEvent } from './Timeline';

describe('buildEventTree', () => {
  it('nests tool results and subagent events under parent tool invocations; orphans go to root', () => {
    const sessionStart: SessionEvent = {
      type: 'SessionStarted',
      timestamp: 't0',
      sessionId: 'a',
      cwd: '/',
      gitBranch: 'main',
      version: '1',
      entrypoint: 'cli',
      source: {},
    };
    const toolInvoked: SessionEvent = {
      type: 'ToolInvoked',
      timestamp: 't1',
      sessionId: 'a',
      toolName: 'Bash',
      toolUseId: 'A',
      input: {},
      source: {},
    };
    const toolSucceeded: SessionEvent = {
      type: 'ToolInvocationSucceeded',
      timestamp: 't2',
      sessionId: 'a',
      toolUseId: 'A',
      content: 'ok',
      source: {},
    };
    const orphanFailed: SessionEvent = {
      type: 'ToolInvocationFailed',
      timestamp: 't3',
      sessionId: 'a',
      toolUseId: 'B',
      error: 'boom',
      source: {},
    };
    const taskInvoked: SessionEvent = {
      type: 'ToolInvoked',
      timestamp: 't4',
      sessionId: 'a',
      toolName: 'Task',
      toolUseId: 'C',
      input: {},
      source: {},
    };
    const subagent: SessionEvent = {
      type: 'SubagentProgressed',
      timestamp: 't5',
      sessionId: 'a',
      parentToolUseId: 'C',
      source: {},
    };
    const orphanSubagent: SessionEvent = {
      type: 'SubagentProgressed',
      timestamp: 't6',
      sessionId: 'a',
      parentToolUseId: 'D',
      source: {},
    };

    const tree = buildEventTree([
      sessionStart,
      toolInvoked,
      toolSucceeded,
      orphanFailed,
      taskInvoked,
      subagent,
      orphanSubagent,
    ]);

    expect(tree).toEqual([
      { event: sessionStart, children: [] },
      { event: toolInvoked, children: [{ event: toolSucceeded, children: [] }] },
      { event: orphanFailed, children: [] },
      { event: taskInvoked, children: [{ event: subagent, children: [] }] },
      { event: orphanSubagent, children: [] },
    ]);
  });
});
