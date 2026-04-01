#!/bin/sh

input=$(cat)

cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
dir=$(basename "$cwd")
model=$(echo "$input" | jq -r '.model.display_name // ""')
transcript=$(echo "$input" | jq -r '.transcript_path // ""')

used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

git_branch=""
git_dirty=""
if [ -n "$cwd" ] && git -C "$cwd" rev-parse --git-dir >/dev/null 2>&1; then
  git_branch=$(git -C "$cwd" symbolic-ref --short HEAD 2>/dev/null \
    || git -C "$cwd" rev-parse --short HEAD 2>/dev/null)
  if [ -n "$(git -C "$cwd" status --porcelain 2>/dev/null)" ]; then
    git_dirty=1
  fi
fi

plan_progress=""
if [ -n "$cwd" ] && [ -f "$cwd/ketchup-plan.md" ]; then
  done_count=$(grep -c '^\s*- \[x\]' "$cwd/ketchup-plan.md" 2>/dev/null || echo 0)
  total_count=$(grep -cE '^\s*- \[(x| )\]' "$cwd/ketchup-plan.md" 2>/dev/null || echo 0)
  if [ "$total_count" -gt 0 ] 2>/dev/null; then
    plan_progress="${done_count}/${total_count}"
  fi
fi

cyan='\033[0;36m'
red='\033[0;31m'
blue='\033[0;34m'
yellow='\033[0;33m'
green='\033[0;32m'
reset='\033[0m'

line=$(printf "${cyan}%s${reset}" "$dir")

if [ -n "$git_branch" ]; then
  if [ -n "$git_dirty" ]; then
    line="$line $(printf "${blue}git:(${red}%s${blue})${reset} ${yellow}x${reset}" "$git_branch")"
  else
    line="$line $(printf "${blue}git:(${red}%s${blue})${reset}" "$git_branch")"
  fi
fi

if [ -n "$plan_progress" ]; then
  line="$line  $(printf "${green}plan:${reset}${plan_progress}")"
fi

if [ -n "$model" ]; then
  line="$line  $model"
fi

if [ -n "$used" ]; then
  used_int=$(printf '%.0f' "$used")
  line="$line  ctx:${used_int}%"
fi

printf "%s" "$line"
