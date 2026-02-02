# Ketchup Plan: Batched Validator Execution

## TODO

- [ ] Burst 1: Add `parseBatchedOutput` tests + `claudeBatchJson` helper [depends: none]
- [ ] Burst 2: Rewrite `validateCommit` tests for batched execution [depends: 1]
- [ ] Burst 3: Rewrite `handleCommitValidation` tests for batched format [depends: 2]
- [ ] Burst 4: Update `pre-tool-use.test.ts` mocks to batched format [depends: 2]
- [ ] Burst 5: Add `batchCount` to hook-state [depends: none]
- [ ] Burst 6: Wire `batchCount` through `validateCommit` [depends: 2, 5]

## DONE
