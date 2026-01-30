# Ketchup Plan: Documentation Update for Claude Ketchup

## TODO

### Bottle: Critical Installation Updates

- [ ] Burst 1: Update README.md installation commands to use npx claude-ketchup install [depends: none]
- [ ] Burst 2: Remove GitHub Packages authentication section from README.md [depends: none]
- [ ] Burst 3: Update getting-started.md installation instructions to use npx approach [depends: none]
- [ ] Burst 4: Replace all @xolvio/claude-ketchup references with claude-ketchup in README.md [depends: none]
- [ ] Burst 5: Replace all @xolvio/claude-ketchup references with claude-ketchup in getting-started.md [depends: none]

### Bottle: CLI Commands Documentation

- [ ] Burst 6: Add claude-ketchup install command to CLI reference in README.md [depends: 1]
- [ ] Burst 7: Add claude-ketchup init command to CLI reference [depends: 6]
- [ ] Burst 8: Add claude-ketchup reminders command to CLI reference [depends: 6]
- [ ] Burst 9: Update claude-ketchup doctor command documentation [depends: 6]

### Bottle: File Structure Updates

- [ ] Burst 10: Update getting-started.md directory structure to show .ketchup/ folders [depends: none]
- [ ] Burst 11: Document .ketchup/reminders/ directory in configuration.md [depends: none]
- [ ] Burst 12: Document .ketchup/validators/ directory in configuration.md [depends: none]
- [ ] Burst 13: Update architecture.md directory structure diagrams [depends: 10, 11, 12]

### Bottle: Terminology Migration (Skills to Reminders)

- [ ] Burst 14: Replace "skills" with "reminders" in getting-started.md [depends: none]
- [ ] Burst 15: Replace "skills" with "reminders" in hooks-guide.md [depends: none]
- [ ] Burst 16: Replace "skills" with "reminders" in configuration.md [depends: none]
- [ ] Burst 17: Replace "skills" with "reminders" in ketchup-technique.md [depends: none]
- [ ] Burst 18: Update API reference function names from skills to reminders [depends: none]

### Bottle: Configuration System Updates

- [ ] Burst 19: Document .claude.hooks.json as primary hook state file in configuration.md [depends: none]
- [ ] Burst 20: Add cosmiconfig (.ketchuprc.json) documentation to configuration.md [depends: none]
- [ ] Burst 21: Update settings merge strategy documentation [depends: none]
- [ ] Burst 22: Document new environment variables in configuration.md [depends: none]

### Bottle: Hook System Updates

- [ ] Burst 23: Update hooks-guide.md to use npx tsx instead of node for scripts [depends: none]
- [ ] Burst 24: Document reminder frontmatter schema in hooks-guide.md [depends: 15]
- [ ] Burst 25: Document validator frontmatter schema in hooks-guide.md [depends: none]
- [ ] Burst 26: Update hook execution flow in architecture.md [depends: 23]

### Bottle: New Documentation Files

- [ ] Burst 27: Create installation.md with detailed npx installation guide [depends: 1, 3]
- [ ] Burst 28: Create reminders-guide.md with complete reminders documentation [depends: 14, 15, 16, 17]
- [ ] Burst 29: Create validators-guide.md with validator system documentation [depends: 12, 25]
- [ ] Burst 30: Add links to new guides in README.md documentation section [depends: 27, 28, 29]

### Bottle: Package.json and Build Updates

- [ ] Burst 31: Update package.json examples to remove @xolvio scope [depends: none]
- [ ] Burst 32: Update all pnpm/yarn/npm command examples to use npx where appropriate [depends: none]
- [ ] Burst 33: Remove package manager specific flags documentation [depends: 32]

### Bottle: Cleanup and Verification

- [ ] Burst 34: Remove obsolete GitHub Actions CI/CD authentication examples [depends: 2]
- [ ] Burst 35: Update troubleshooting section with new installation issues [depends: 27]
- [ ] Burst 36: Verify all code examples work with new installation method [depends: 1, 3, 27]
- [ ] Burst 37: Check for any remaining @xolvio references across all docs [depends: 4, 5, 31]

## DONE

- [x] Burst 0: Analyze codebase and identify all documentation discrepancies (e22c19b)