---
"claude-ketchup": minor
---

- Fixed validator token counting to include cached tokens in the total, giving accurate API usage reporting
- Added per-validator token usage (input/output) to activity logs for better observability
- Improved validator reliability with fail-safe NACK defaults, automatic retry on invalid responses, and exclusion of appeal-system from regular runs
- Switched validators to run in parallel for faster execution, with detailed activity logging
