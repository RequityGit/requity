#!/bin/bash
# Stop hook (asyncRewake): every 6 hours, wake Claude to check Sentry
# for new unresolved errors via the Sentry MCP.
#
# Uses a timestamp file to throttle. Exit 0 = skip, Exit 2 = wake.

TIMESTAMP_FILE="/tmp/claude-sentry-last-check"
INTERVAL_SECONDS=21600  # 6 hours

# Check if enough time has passed
if [ -f "$TIMESTAMP_FILE" ]; then
  LAST_CHECK=$(cat "$TIMESTAMP_FILE")
  NOW=$(date +%s)
  ELAPSED=$((NOW - LAST_CHECK))
  if [ "$ELAPSED" -lt "$INTERVAL_SECONDS" ]; then
    exit 0
  fi
fi

# Update timestamp
date +%s > "$TIMESTAMP_FILE"

# Wake Claude to check Sentry
echo '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"Periodic Sentry check (every 6 hours). Use the Sentry MCP to check for new unresolved errors in the requity project from the last 6 hours. If there are new errors, briefly list them and offer to diagnose/fix. If none, just say all clear."}}'
exit 2
