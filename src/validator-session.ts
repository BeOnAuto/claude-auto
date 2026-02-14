export function isValidatorSession(prompt: string | undefined): boolean {
  if (!prompt) return false;

  const hasDiff = prompt.includes('<diff>');
  const hasCommitMessage = prompt.includes('<commit-message>');
  const hasFiles = prompt.includes('<files>');

  return hasDiff && hasCommitMessage && hasFiles;
}
