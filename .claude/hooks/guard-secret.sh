#!/bin/bash
COMMAND=$(jq -r '.tool_input.command')
if echo "$COMMAND" | grep -q 'session\.ts\|add \.'; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",
    permissionDecisionReason:"lib/session.ts holds ADMIN_PASSWORD. Stage files by name."}}'
else exit 0; fi
