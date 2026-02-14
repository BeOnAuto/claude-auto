# Ketchup Plan: Skip Reminders for Validator Subagents

## TODO

(none)

## DONE

- [x] Burst 1: Create isValidatorSession function that detects validator prompts [depends: none]
- [x] Burst 2: Update handleSessionStart to skip reminders when isValidatorSession returns true [depends: 1]
- [x] Burst 3: Update handleUserPromptSubmit to skip reminders when isValidatorSession returns true [depends: 1]
