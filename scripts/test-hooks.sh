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
# Test: auto-continue respects mode=off (no transcript needed)
#-----------------------------------------------------------
test_autocontinue_mode_off() {
    local name="auto-continue respects mode=off"

    # Backup current state
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local backup=""
    if [[ -f "$state_file" ]]; then
        backup=$(cat "$state_file")
    fi

    # Set mode to off
    echo '{"autoContinue":{"mode":"off"}}' > "$state_file"

    local input='{"session_id":"test-off","permission_mode":"code"}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null) || true

    # Restore state
    if [[ -n "$backup" ]]; then
        echo "$backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    if echo "$output" | grep -q '"decision":"block"'; then
        fail "$name" "should not block when mode=off"
    else
        pass "$name"
    fi
}

#-----------------------------------------------------------
# Test: auto-continue skips plan permission mode
#-----------------------------------------------------------
test_autocontinue_skips_plan_mode() {
    local name="auto-continue skips plan permission mode"

    # Backup current state
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local backup=""
    if [[ -f "$state_file" ]]; then
        backup=$(cat "$state_file")
    fi

    # Set mode to smart (but plan mode should be skipped)
    echo '{"autoContinue":{"mode":"smart"}}' > "$state_file"

    # permission_mode="plan" should be skipped by default
    local input='{"session_id":"test-plan","permission_mode":"plan"}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null) || true

    # Restore state
    if [[ -n "$backup" ]]; then
        echo "$backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    if echo "$output" | grep -q '"decision":"block"'; then
        fail "$name" "should skip plan mode"
    else
        pass "$name"
    fi
}

#-----------------------------------------------------------
# Test: non-stop mode blocks and counts iterations
#-----------------------------------------------------------
test_autocontinue_nonstop_iterations() {
    local name="auto-continue non-stop mode counts iterations"

    # Backup current state
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local backup=""
    if [[ -f "$state_file" ]]; then
        backup=$(cat "$state_file")
    fi

    # Set non-stop mode with limit of 2
    echo '{"autoContinue":{"mode":"non-stop","maxIterations":2,"iteration":0}}' > "$state_file"

    local input='{"session_id":"test-nonstop","permission_mode":"code"}'

    cd "$PROJECT_ROOT"

    # First call: should block and increment
    local output1
    output1=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null)

    if ! echo "$output1" | grep -q '"decision":"block"'; then
        # Restore state
        if [[ -n "$backup" ]]; then
            echo "$backup" > "$state_file"
        else
            rm -f "$state_file"
        fi
        fail "$name" "iteration 1 should block"
        return
    fi

    # Second call: should block again
    local output2
    output2=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null)

    if ! echo "$output2" | grep -q '"decision":"block"'; then
        # Restore state
        if [[ -n "$backup" ]]; then
            echo "$backup" > "$state_file"
        else
            rm -f "$state_file"
        fi
        fail "$name" "iteration 2 should block"
        return
    fi

    # Third call: should allow (maxIterations reached)
    local output3
    output3=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null) || true

    # Restore state
    if [[ -n "$backup" ]]; then
        echo "$backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    if echo "$output3" | grep -q '"decision":"block"'; then
        fail "$name" "iteration 3 should allow (limit reached)"
    else
        pass "$name"
    fi
}

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
# Test: sub-agent state modifications persist
#-----------------------------------------------------------
test_subagent_state_persists() {
    local name="sub-agent state modifications persist"

    # Backup current state
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local backup=""
    if [[ -f "$state_file" ]]; then
        backup=$(cat "$state_file")
    fi

    # Set initial state with iteration=5
    echo '{"autoContinue":{"mode":"non-stop","maxIterations":10,"iteration":5}}' > "$state_file"

    # Simulate a sub-agent call that would increment iteration
    # (non-stop mode increments on each block)
    local input='{"session_id":"subagent-test","permission_mode":"code"}'

    cd "$PROJECT_ROOT"
    echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null || true

    # Read back the state - iteration should now be 6
    local new_state
    new_state=$(cat "$state_file")

    # Restore original state
    if [[ -n "$backup" ]]; then
        echo "$backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    if echo "$new_state" | grep -q '"iteration": 6'; then
        pass "$name"
    else
        fail "$name" "state should persist iteration increment, got: $new_state"
    fi
}

#-----------------------------------------------------------
# Test: sub-agent respects skipModes configuration
#-----------------------------------------------------------
test_subagent_respects_skipmodes() {
    local name="sub-agent respects custom skipModes"

    # Backup current state
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local backup=""
    if [[ -f "$state_file" ]]; then
        backup=$(cat "$state_file")
    fi

    # Set mode to non-stop but add "explore" to skipModes
    # This simulates skipping auto-continue for explore sub-agents
    echo '{"autoContinue":{"mode":"non-stop","skipModes":["plan","explore"]}}' > "$state_file"

    # Simulate a sub-agent with permission_mode="explore"
    local input='{"session_id":"explore-agent","permission_mode":"explore"}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null) || true

    # Restore state
    if [[ -n "$backup" ]]; then
        echo "$backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    # Should NOT block because "explore" is in skipModes
    if echo "$output" | grep -q '"decision":"block"'; then
        fail "$name" "should skip auto-continue for explore permission_mode"
    else
        pass "$name"
    fi
}

#-----------------------------------------------------------
# Test: sub-agent non-skipped mode still blocks
#-----------------------------------------------------------
test_subagent_nonskipped_blocks() {
    local name="sub-agent non-skipped mode blocks correctly"

    # Backup current state
    local state_file="$PROJECT_ROOT/.claude.hooks.json"
    local backup=""
    if [[ -f "$state_file" ]]; then
        backup=$(cat "$state_file")
    fi

    # Set mode to non-stop with only "plan" in skipModes
    echo '{"autoContinue":{"mode":"non-stop","maxIterations":10,"skipModes":["plan"]}}' > "$state_file"

    # Simulate a sub-agent with permission_mode="code" (NOT in skipModes)
    local input='{"session_id":"code-agent","permission_mode":"code"}'

    cd "$PROJECT_ROOT"
    local output
    output=$(echo "$input" | npx tsx "$PROJECT_ROOT/.claude/scripts/auto-continue.ts" 2>/dev/null) || true

    # Restore state
    if [[ -n "$backup" ]]; then
        echo "$backup" > "$state_file"
    else
        rm -f "$state_file"
    fi

    # SHOULD block because "code" is not in skipModes
    if echo "$output" | grep -q '"decision":"block"'; then
        pass "$name"
    else
        fail "$name" "should block for non-skipped permission_mode"
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
# Run all tests
#-----------------------------------------------------------
echo "Running hook E2E tests..."
echo ""

echo "=== Basic Hook Tests ==="
test_autocontinue_mode_off
test_autocontinue_skips_plan_mode
test_autocontinue_nonstop_iterations
test_denylist_denies
test_denylist_allows_normal
test_prompt_reminder_returns_context

echo ""
echo "=== Sub-Agent Hook Tests ==="
test_subagent_inherits_denylist
test_subagent_state_persists
test_subagent_respects_skipmodes
test_subagent_nonskipped_blocks

echo ""
echo "=== Sub-Agent Classification Tests ==="
test_subagent_classifier_explore
test_subagent_classifier_work
test_shouldvalidatecommit_respects_state
test_extract_task_description

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $PASSED passed, $FAILED failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit $((FAILED > 0 ? 1 : 0))
