#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMP_BASE=$(mktemp -d)
trap "rm -rf $TEMP_BASE" EXIT

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASSED=0
FAILED=0

pass() { echo -e "${GREEN}✓${NC} $1"; ((PASSED++)) || true; }
fail() { echo -e "${RED}✗${NC} $1: $2"; ((FAILED++)) || true; }
skip() { echo -e "${YELLOW}○${NC} $1 (skipped)"; }

#-----------------------------------------------------------
# Test: deny-list denies paths on deny list
#-----------------------------------------------------------
test_denylist_denies() {
    local name="deny-list denies paths on deny list"

    # Backup state and deny list
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local state_backup=""
    if [[ -f "$state_file" ]]; then
        state_backup=$(cat "$state_file")
    fi

    local deny_file="$PROJECT_ROOT/.claude/scripts/deny-list.txt"
    local deny_backup=""
    if [[ -f "$deny_file" ]]; then
        deny_backup=$(cat "$deny_file")
    fi

    # Enable deny list in state and add test pattern
    echo '{"denyList":{"enabled":true}}' > "$state_file"
    echo "test-secret.txt" > "$deny_file"

    # Simulate PreToolUse input for Edit tool
    local input='{"tool_name":"Edit","tool_input":{"file_path":"test-secret.txt"}}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/deny-list.ts" 2>/dev/null) || true

    # Restore state and deny list
    if [[ -n "$state_backup" ]]; then
        echo "$state_backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    if [[ -n "$deny_backup" ]]; then
        echo "$deny_backup" > "$deny_file"
    else
        rm -f "$deny_file"
    fi

    if echo "$output" | grep -q '"permissionDecision":"deny"'; then
        pass "$name"
    else
        fail "$name" "should deny access to test-secret.txt, got: $output"
    fi
}

#-----------------------------------------------------------
# Test: deny-list allows non-denied paths
#-----------------------------------------------------------
test_denylist_allows_normal() {
    local name="deny-list allows normal paths"

    # Backup state and deny list
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local state_backup=""
    if [[ -f "$state_file" ]]; then
        state_backup=$(cat "$state_file")
    fi

    local deny_file="$PROJECT_ROOT/.claude/scripts/deny-list.txt"
    local deny_backup=""
    if [[ -f "$deny_file" ]]; then
        deny_backup=$(cat "$deny_file")
    fi

    # Enable deny list but only deny something-else.txt
    echo '{"denyList":{"enabled":true}}' > "$state_file"
    echo "something-else.txt" > "$deny_file"

    local input='{"tool_name":"Edit","tool_input":{"file_path":"normal-file.txt"}}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/deny-list.ts" 2>/dev/null) || true

    # Restore state and deny list
    if [[ -n "$state_backup" ]]; then
        echo "$state_backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    if [[ -n "$deny_backup" ]]; then
        echo "$deny_backup" > "$deny_file"
    else
        rm -f "$deny_file"
    fi

    if echo "$output" | grep -q '"permissionDecision":"deny"'; then
        fail "$name" "should not deny normal-file.txt"
    else
        pass "$name"
    fi
}

#-----------------------------------------------------------
# Test: prompt-reminder returns context
#-----------------------------------------------------------
test_prompt_reminder_returns_context() {
    local name="prompt-reminder returns context"

    local input='{"prompt":"help me code"}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/prompt-reminder.ts" 2>/dev/null) || true

    # Should contain some kind of response (not empty)
    if [[ -n "$output" ]]; then
        pass "$name"
    else
        fail "$name" "should return some context"
    fi
}

#-----------------------------------------------------------
# Test: sub-agent inherits deny-list (permission_mode doesn't bypass)
#-----------------------------------------------------------
test_subagent_inherits_denylist() {
    local name="sub-agent inherits deny-list protection"

    # Backup state and deny list
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local state_backup=""
    if [[ -f "$state_file" ]]; then
        state_backup=$(cat "$state_file")
    fi

    local deny_file="$PROJECT_ROOT/.claude/scripts/deny-list.txt"
    local deny_backup=""
    if [[ -f "$deny_file" ]]; then
        deny_backup=$(cat "$deny_file")
    fi

    # Enable deny list and add test pattern
    echo '{"denyList":{"enabled":true}}' > "$state_file"
    echo "protected-file.txt" > "$deny_file"

    # Simulate PreToolUse from a sub-agent (with permission_mode that might be different)
    # Sub-agents should STILL be blocked by deny-list regardless of permission_mode
    local input='{"tool_name":"Edit","tool_input":{"file_path":"protected-file.txt"},"permission_mode":"plan"}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/deny-list.ts" 2>/dev/null) || true

    # Restore state and deny list
    if [[ -n "$state_backup" ]]; then
        echo "$state_backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    if [[ -n "$deny_backup" ]]; then
        echo "$deny_backup" > "$deny_file"
    else
        rm -f "$deny_file"
    fi

    if echo "$output" | grep -q '"permissionDecision":"deny"'; then
        pass "$name"
    else
        fail "$name" "sub-agent should still be blocked by deny-list"
    fi
}

#-----------------------------------------------------------
# Test: subagent-classifier classifies explore tasks
#-----------------------------------------------------------
test_subagent_classifier_explore() {
    local name="subagent-classifier classifies explore tasks"

    cd "$PROJECT_ROOT"

    # Create temp test file with absolute import
    local test_file="$PROJECT_ROOT/scripts/_test-classify-explore.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent } from '../src/subagent-classifier.js';
console.log(classifySubagent('Search for auth implementation'));
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if [[ "$output" == "explore" ]]; then
        pass "$name"
    else
        fail "$name" "expected 'explore', got '$output'"
    fi
}

#-----------------------------------------------------------
# Test: subagent-classifier classifies work tasks
#-----------------------------------------------------------
test_subagent_classifier_work() {
    local name="subagent-classifier classifies work tasks"

    cd "$PROJECT_ROOT"

    # Create temp test file with absolute import
    local test_file="$PROJECT_ROOT/scripts/_test-classify-work.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent } from '../src/subagent-classifier.js';
console.log(classifySubagent('Implement the new feature'));
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if [[ "$output" == "work" ]]; then
        pass "$name"
    else
        fail "$name" "expected 'work', got '$output'"
    fi
}

#-----------------------------------------------------------
# Test: shouldValidateCommit respects subagentHooks state
#-----------------------------------------------------------
test_shouldvalidatecommit_respects_state() {
    local name="shouldValidateCommit respects subagentHooks state"

    cd "$PROJECT_ROOT"

    # Create temp test file with absolute import
    local test_file="$PROJECT_ROOT/scripts/_test-should-validate.ts"
    cat > "$test_file" << 'EOF'
import { shouldValidateCommit } from '../src/hooks/validate-commit.js';
const state = { validateCommitOnExplore: false, validateCommitOnWork: true, validateCommitOnUnknown: true };
console.log(shouldValidateCommit('explore', state) ? 'true' : 'false');
console.log(shouldValidateCommit('work', state) ? 'true' : 'false');
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    local expected=$'false\ntrue'
    if [[ "$output" == "$expected" ]]; then
        pass "$name"
    else
        fail "$name" "expected 'false\\ntrue', got '$output'"
    fi
}

#-----------------------------------------------------------
# Test: extractTaskDescription parses Task invocations
#-----------------------------------------------------------
test_extract_task_description() {
    local name="extractTaskDescription parses Task invocations"

    cd "$PROJECT_ROOT"

    # Create temp test file with absolute import
    local test_file="$PROJECT_ROOT/scripts/_test-extract.ts"
    cat > "$test_file" << 'EOF'
import { extractTaskDescription } from '../src/subagent-classifier.js';
const transcript = '<invoke name="Task"><parameter name="description">Search for files</parameter></invoke>';
console.log(extractTaskDescription(transcript) || 'undefined');
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if [[ "$output" == "Search for files" ]]; then
        pass "$name"
    else
        fail "$name" "expected 'Search for files', got '$output'"
    fi
}

#-----------------------------------------------------------
# Test: full integration - explore task skips validation
#-----------------------------------------------------------
test_integration_explore_skips_validation() {
    local name="integration: explore task skips validation by default"

    cd "$PROJECT_ROOT"

    # Create integration test file
    local test_file="$PROJECT_ROOT/scripts/_test-integration-explore.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent, extractTaskDescription } from '../src/subagent-classifier.js';
import { shouldValidateCommit } from '../src/hooks/validate-commit.js';
import { DEFAULT_HOOK_STATE } from '../src/hook-state.js';

// Simulate a transcript with an explore task
const transcript = '<invoke name="Task"><parameter name="description">Search for auth implementation</parameter></invoke>';

// Extract and classify
const description = extractTaskDescription(transcript);
const subagentType = classifySubagent(description || '');

// Check if validation should run with default state
const shouldValidate = shouldValidateCommit(subagentType, DEFAULT_HOOK_STATE.subagentHooks);

console.log(`description: ${description}`);
console.log(`type: ${subagentType}`);
console.log(`shouldValidate: ${shouldValidate}`);
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if echo "$output" | grep -q "type: explore" && echo "$output" | grep -q "shouldValidate: false"; then
        pass "$name"
    else
        fail "$name" "explore task should skip validation, got: $output"
    fi
}

#-----------------------------------------------------------
# Test: full integration - work task runs validation
#-----------------------------------------------------------
test_integration_work_runs_validation() {
    local name="integration: work task runs validation by default"

    cd "$PROJECT_ROOT"

    # Create integration test file
    local test_file="$PROJECT_ROOT/scripts/_test-integration-work.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent, extractTaskDescription } from '../src/subagent-classifier.js';
import { shouldValidateCommit } from '../src/hooks/validate-commit.js';
import { DEFAULT_HOOK_STATE } from '../src/hook-state.js';

// Simulate a transcript with a work task
const transcript = '<invoke name="Task"><parameter name="description">Implement the new feature</parameter></invoke>';

// Extract and classify
const description = extractTaskDescription(transcript);
const subagentType = classifySubagent(description || '');

// Check if validation should run with default state
const shouldValidate = shouldValidateCommit(subagentType, DEFAULT_HOOK_STATE.subagentHooks);

console.log(`description: ${description}`);
console.log(`type: ${subagentType}`);
console.log(`shouldValidate: ${shouldValidate}`);
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if echo "$output" | grep -q "type: work" && echo "$output" | grep -q "shouldValidate: true"; then
        pass "$name"
    else
        fail "$name" "work task should run validation, got: $output"
    fi
}

#-----------------------------------------------------------
# Test: full integration - unknown task runs validation (safe default)
#-----------------------------------------------------------
test_integration_unknown_runs_validation() {
    local name="integration: unknown task runs validation (safe default)"

    cd "$PROJECT_ROOT"

    # Create integration test file
    local test_file="$PROJECT_ROOT/scripts/_test-integration-unknown.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent, extractTaskDescription } from '../src/subagent-classifier.js';
import { shouldValidateCommit } from '../src/hooks/validate-commit.js';
import { DEFAULT_HOOK_STATE } from '../src/hook-state.js';

// Simulate a transcript with an ambiguous task
const transcript = '<invoke name="Task"><parameter name="description">Process the data</parameter></invoke>';

// Extract and classify
const description = extractTaskDescription(transcript);
const subagentType = classifySubagent(description || '');

// Check if validation should run with default state
const shouldValidate = shouldValidateCommit(subagentType, DEFAULT_HOOK_STATE.subagentHooks);

console.log(`description: ${description}`);
console.log(`type: ${subagentType}`);
console.log(`shouldValidate: ${shouldValidate}`);
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if echo "$output" | grep -q "type: unknown" && echo "$output" | grep -q "shouldValidate: true"; then
        pass "$name"
    else
        fail "$name" "unknown task should run validation (safe default), got: $output"
    fi
}

#-----------------------------------------------------------
# Test: state file controls subagent validation behavior
#-----------------------------------------------------------
test_integration_state_controls_behavior() {
    local name="integration: state file controls subagent validation behavior"

    # Backup current state
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local backup=""
    if [[ -f "$state_file" ]]; then
        backup=$(cat "$state_file")
    fi

    # Set custom state: enable validation for explore, disable for work
    echo '{"subagentHooks":{"validateCommitOnExplore":true,"validateCommitOnWork":false,"validateCommitOnUnknown":true}}' > "$state_file"

    cd "$PROJECT_ROOT"

    # Create integration test file
    local test_file="$PROJECT_ROOT/scripts/_test-integration-state.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent } from '../src/subagent-classifier.js';
import { shouldValidateCommit } from '../src/hooks/validate-commit.js';
import { createHookState } from '../src/hook-state.js';

const hookState = createHookState(process.cwd());
const state = hookState.read();

// Test explore
const exploreType = classifySubagent('Search for files');
const exploreValidate = shouldValidateCommit(exploreType, state.subagentHooks);

// Test work
const workType = classifySubagent('Implement feature');
const workValidate = shouldValidateCommit(workType, state.subagentHooks);

console.log(`explore: ${exploreValidate}`);
console.log(`work: ${workValidate}`);
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    # Restore state
    if [[ -n "$backup" ]]; then
        echo "$backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    # With our custom state: explore=true, work=false (opposite of default)
    if echo "$output" | grep -q "explore: true" && echo "$output" | grep -q "work: false"; then
        pass "$name"
    else
        fail "$name" "state file should control behavior, got: $output"
    fi
}

#-----------------------------------------------------------
# Test: classifier handles all explore patterns
#-----------------------------------------------------------
test_classifier_all_explore_patterns() {
    local name="classifier handles all explore patterns"

    cd "$PROJECT_ROOT"

    local test_file="$PROJECT_ROOT/scripts/_test-all-explore.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent } from '../src/subagent-classifier.js';

const patterns = [
    'Search for files matching pattern',
    'Find the implementation',
    'Understand how it works',
    'Investigate the error',
    'Analyze the codebase',
    'Look for usages',
    'Research existing patterns',
    'Explore the architecture',
    'Discover dependencies',
    'Locate the config file',
];

let allExplore = true;
for (const p of patterns) {
    const result = classifySubagent(p);
    if (result !== 'explore') {
        console.log(`FAIL: "${p}" classified as ${result}`);
        allExplore = false;
    }
}
console.log(allExplore ? 'ALL_EXPLORE' : 'SOME_FAILED');
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if [[ "$output" == "ALL_EXPLORE" ]]; then
        pass "$name"
    else
        fail "$name" "not all explore patterns classified correctly: $output"
    fi
}

#-----------------------------------------------------------
# Test: classifier handles all work patterns
#-----------------------------------------------------------
test_classifier_all_work_patterns() {
    local name="classifier handles all work patterns"

    cd "$PROJECT_ROOT"

    local test_file="$PROJECT_ROOT/scripts/_test-all-work.ts"
    cat > "$test_file" << 'EOF'
import { classifySubagent } from '../src/subagent-classifier.js';

const patterns = [
    'Implement the new feature',
    'Create a user form',
    'Write tests for login',
    'Fix the bug in parser',
    'Refactor the database layer',
    'Update the configuration',
    'Add error handling',
    'Build the API endpoint',
    'Modify the schema',
    'Change the default value',
    'Remove unused code',
    'Delete the deprecated file',
];

let allWork = true;
for (const p of patterns) {
    const result = classifySubagent(p);
    if (result !== 'work') {
        console.log(`FAIL: "${p}" classified as ${result}`);
        allWork = false;
    }
}
console.log(allWork ? 'ALL_WORK' : 'SOME_FAILED');
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if [[ "$output" == "ALL_WORK" ]]; then
        pass "$name"
    else
        fail "$name" "not all work patterns classified correctly: $output"
    fi
}

#-----------------------------------------------------------
# Test: DEFAULT_HOOK_STATE has correct subagentHooks defaults
#-----------------------------------------------------------
test_default_state_subagent_hooks() {
    local name="DEFAULT_HOOK_STATE has correct subagentHooks defaults"

    cd "$PROJECT_ROOT"

    local test_file="$PROJECT_ROOT/scripts/_test-default-state.ts"
    cat > "$test_file" << 'EOF'
import { DEFAULT_HOOK_STATE } from '../src/hook-state.js';

const sh = DEFAULT_HOOK_STATE.subagentHooks;
const correct =
    sh.validateCommitOnExplore === false &&
    sh.validateCommitOnWork === true &&
    sh.validateCommitOnUnknown === true;

console.log(correct ? 'CORRECT' : `WRONG: explore=${sh.validateCommitOnExplore}, work=${sh.validateCommitOnWork}, unknown=${sh.validateCommitOnUnknown}`);
EOF

    local output
    output=$(npx tsx "$test_file" 2>/dev/null) || true
    rm -f "$test_file"

    if [[ "$output" == "CORRECT" ]]; then
        pass "$name"
    else
        fail "$name" "$output"
    fi
}

#-----------------------------------------------------------
# Run all tests
#-----------------------------------------------------------
echo "Running hook E2E tests..."
echo ""

echo "=== Basic Hook Tests ==="
test_denylist_denies
test_denylist_allows_normal
test_prompt_reminder_returns_context

echo ""
echo "=== Sub-Agent Hook Tests ==="
test_subagent_inherits_denylist

echo ""
echo "=== Sub-Agent Classification Tests ==="
test_subagent_classifier_explore
test_subagent_classifier_work
test_shouldvalidatecommit_respects_state
test_extract_task_description

echo ""
echo "=== Classification Integration Tests ==="
test_integration_explore_skips_validation
test_integration_work_runs_validation
test_integration_unknown_runs_validation
test_integration_state_controls_behavior
test_classifier_all_explore_patterns
test_classifier_all_work_patterns
test_default_state_subagent_hooks

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $PASSED passed, $FAILED failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit $((FAILED > 0 ? 1 : 0))
