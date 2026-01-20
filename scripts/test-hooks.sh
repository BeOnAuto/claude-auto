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
# Run all tests
#-----------------------------------------------------------
echo "Running hook E2E tests..."
echo ""

test_autocontinue_mode_off
test_autocontinue_skips_plan_mode
test_autocontinue_nonstop_iterations
test_denylist_denies
test_denylist_allows_normal
test_prompt_reminder_returns_context

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $PASSED passed, $FAILED failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit $((FAILED > 0 ? 1 : 0))
