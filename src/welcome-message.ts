export const FIRST_SETUP_MESSAGE = `CRITICAL INSTRUCTION — DO THIS BEFORE ANYTHING ELSE:

The claude-auto plugin has just been installed in this project for the first time. You MUST guide the user through setup before doing any work.

DO NOT proceed with the user's request yet. Instead:

1. Greet the user and explain that claude-auto is now active
2. Briefly explain what it does:
   - Commit validation (17 validators enforce TDD, coverage, code quality)
   - Reminders injected into prompts (TCR workflow, testing rules)
   - File protection via deny-lists
   - Auto-continue to keep working until the plan is done
3. Run /claude-auto:config show to display the current configuration
4. Ask the user if they want to customize anything, or proceed with defaults
5. ONLY AFTER the user confirms, proceed with their original request

The default workflow follows the Ketchup Technique:
- Create ketchup-plan.md with TODO/DONE sections before coding
- One failing test → minimal passing code → commit (TCR)
- 100% test coverage, no exceptions

This setup runs once. After this, normal reminders will guide the workflow.`;
