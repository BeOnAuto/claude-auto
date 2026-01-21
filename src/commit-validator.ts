export function isCommitCommand(command: string): boolean {
  return /\bgit\s+commit\b/.test(command);
}
