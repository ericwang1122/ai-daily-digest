#!/usr/bin/env node
/**
 * push-digest.mjs
 *
 * Reads the digest text from stdin (or --file <path>) and pushes it
 * to the AI Daily Digest website.
 *
 * Usage:
 *   echo "# Digest..." | node scripts/push-digest.mjs
 *   node scripts/push-digest.mjs --file /tmp/digest.md
 *   node scripts/push-digest.mjs --file /tmp/digest.md --date 2026-03-25
 *
 * Environment (can also be in ~/.follow-builders/push.env):
 *   DIGEST_SITE_URL   - Your deployed site URL, e.g. https://ai-digest.vercel.app
 *   PUSH_SECRET       - The PUSH_SECRET value set in Vercel env vars
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createInterface } from 'readline';

// ── Load env from ~/.follow-builders/push.env ─────────────────────────────
const envFile = join(homedir(), '.follow-builders', 'push.env');
if (existsSync(envFile)) {
  const lines = readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0 && !process.env[key]) {
      process.env[key] = rest.join('=').replace(/^["']|["']$/g, '');
    }
  }
}

// ── Parse args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const dateIdx = args.indexOf('--date');

const filePath = fileIdx !== -1 ? args[fileIdx + 1] : null;
const dateArg = dateIdx !== -1 ? args[dateIdx + 1] : null;
const date = dateArg ?? new Date().toISOString().slice(0, 10);

const siteUrl = process.env.DIGEST_SITE_URL?.replace(/\/$/, '');
const pushSecret = process.env.PUSH_SECRET;

if (!siteUrl) {
  console.error('Error: DIGEST_SITE_URL is not set.');
  console.error('  Set it in ~/.follow-builders/push.env or as an environment variable.');
  process.exit(1);
}

if (!pushSecret) {
  console.error('Error: PUSH_SECRET is not set.');
  console.error('  Set it in ~/.follow-builders/push.env or as an environment variable.');
  process.exit(1);
}

// ── Read content ────────────────────────────────────────────────────────────
async function readContent() {
  if (filePath) {
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    return readFileSync(filePath, 'utf-8');
  }

  // Read from stdin
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin });
    const lines = [];
    rl.on('line', (line) => lines.push(line));
    rl.on('close', () => resolve(lines.join('\n')));
  });
}

// ── Push ────────────────────────────────────────────────────────────────────
const content = await readContent();

if (!content.trim()) {
  console.error('Error: Content is empty.');
  process.exit(1);
}

console.log(`Pushing digest for ${date} to ${siteUrl}...`);

const response = await fetch(`${siteUrl}/api/digest/push`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date, content, secret: pushSecret }),
});

const result = await response.json();

if (!response.ok) {
  console.error(`Error: ${result.error ?? 'Unknown error'} (HTTP ${response.status})`);
  process.exit(1);
}

console.log(`Done! Digest for ${result.date} is now live at ${siteUrl}/${result.date}`);
