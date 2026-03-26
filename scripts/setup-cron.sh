#!/bin/bash
# setup-cron.sh
#
# Sets up the local cron job to auto-push digests daily.
# Run once after configuring ~/.follow-builders/push.env
#
# Usage: bash scripts/setup-cron.sh [hour] [minute]
#   Default: 9:00 AM local time
#
# Example: bash scripts/setup-cron.sh 8 30   → runs at 8:30 AM

HOUR="${1:-9}"
MINUTE="${2:-0}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$SCRIPT_DIR/auto-push.sh"

CRON_ENTRY="$MINUTE $HOUR * * * bash \"$SCRIPT_PATH\" >> \$HOME/.follow-builders/push.log 2>&1"

echo "Adding cron job: runs daily at ${HOUR}:$(printf '%02d' $MINUTE)"
echo "Script: $SCRIPT_PATH"
echo ""

# Add to crontab if not already present
if crontab -l 2>/dev/null | grep -qF "$SCRIPT_PATH"; then
  echo "Cron job already exists. Removing old entry..."
  crontab -l 2>/dev/null | grep -vF "$SCRIPT_PATH" | crontab -
fi

(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
echo "Done! Cron job installed."
echo ""
echo "Verify with: crontab -l"
echo "View logs:   tail -f ~/.follow-builders/push.log"
