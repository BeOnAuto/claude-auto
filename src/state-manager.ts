import * as fs from 'node:fs';
import * as path from 'node:path';

type State = Record<string, unknown>;

export function readState(dir: string): State {
  const statePath = path.join(dir, 'state.json');

  if (!fs.existsSync(statePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

export function writeState(dir: string, state: State): void {
  const statePath = path.join(dir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}
