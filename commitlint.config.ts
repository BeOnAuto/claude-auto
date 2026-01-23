import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-enum': [2, 'always', ['cli', 'hooks', 'skills', 'core', 'docs', 'global', 'ci', 'release']],
    'scope-empty': [2, 'never'],
  },
};

export default config;
