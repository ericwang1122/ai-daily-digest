#!/bin/bash
# auto-push.sh
#
# Runs the follow-builders skill, generates a digest with Claude,
# and pushes it to the AI Daily Digest website.
#
# Set up as a crontab entry:
#   0 9 * * * bash /path/to/scripts/auto-push.sh >> ~/.follow-builders/push.log 2>&1
#
# Requires:
#   - Node.js
#   - DIGEST_SITE_URL and PUSH_SECRET in ~/.follow-builders/push.env
#   - ANTHROPIC_API_KEY in environment or ~/.follow-builders/push.env

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SCRIPTS="$HOME/.claude/skills/ai-news-summary/scripts"
TMP_FILE="/tmp/ai-digest-$(date +%Y%m%d).md"

echo "[$(date)] Starting digest generation..."

# Load env
if [ -f "$HOME/.follow-builders/push.env" ]; then
  export $(grep -v '^#' "$HOME/.follow-builders/push.env" | xargs) 2>/dev/null || true
fi

# Step 1: Fetch feeds
echo "[$(date)] Fetching feeds..."
FEED_JSON=$(node "$SKILL_SCRIPTS/prepare-digest.js" 2>/dev/null)

if [ -z "$FEED_JSON" ]; then
  echo "[$(date)] ERROR: Failed to fetch feeds"
  exit 1
fi

# Step 2: Generate digest using Claude API directly (via curl)
echo "[$(date)] Generating digest with Claude..."

TODAY=$(date +%Y-%m-%d)

# Build the prompt (escaped JSON)
PROMPT=$(echo "$FEED_JSON" | node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
const prompt = \`You are an AI content curator. Today is ${TODAY}. Language: bilingual (English + Chinese, interleaved).

Follow these instructions:
\${data.prompts.digest_intro}
\${data.prompts.summarize_tweets}
\${data.prompts.summarize_podcast}
\${data.prompts.translate}

Here is the content to remix:
\${JSON.stringify({ date: '${TODAY}', x: data.x, podcasts: data.podcasts }, null, 2)}

Produce the full bilingual digest now.\`;
console.log(JSON.stringify(prompt));
")

# Call Claude API
RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d "{
    \"model\": \"claude-sonnet-4-6\",
    \"max_tokens\": 4096,
    \"messages\": [{\"role\": \"user\", \"content\": $PROMPT}]
  }")

# Extract text content
CONTENT=$(echo "$RESPONSE" | node -e "
const fs = require('fs');
const r = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
if (r.error) { console.error('API error:', r.error.message); process.exit(1); }
console.log(r.content[0].text);
")

echo "$CONTENT" > "$TMP_FILE"

# Step 3: Push to website
echo "[$(date)] Pushing to website..."
node "$SCRIPT_DIR/push-digest.mjs" --file "$TMP_FILE" --date "$TODAY"

echo "[$(date)] Done!"
rm -f "$TMP_FILE"
