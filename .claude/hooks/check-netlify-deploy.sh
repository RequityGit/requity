#!/bin/bash
# PostToolUse hook (asyncRewake): after a git push, wait 10 minutes
# then wake Claude to check Netlify deploy status via MCP.
#
# stdin: JSON with tool_name + tool_input from Claude Code
# Exit 0 = no-op (silent), Exit 2 = wake the model

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only care about Bash tool calls that are git push
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

if ! echo "$COMMAND" | grep -qE '^\s*git\s+push'; then
  exit 0
fi

# Wait 10 minutes for the Netlify build to complete
sleep 600

# Wake Claude with context about what to do
echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"A git push was detected 10 minutes ago. Check the latest Netlify deploy status using the Netlify MCP. If the build failed, diagnose the error from the build logs and fix it. If the build succeeded, briefly confirm to the user."}}'
exit 2
