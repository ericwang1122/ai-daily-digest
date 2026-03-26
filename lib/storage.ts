import { put, list, get } from '@vercel/blob';

const DIGEST_PREFIX = 'digests/';
const SETTINGS_KEY = 'config/settings.json';

export interface DigestEntry {
  date: string;        // YYYY-MM-DD
  content: string;     // markdown text
  generatedAt: string; // ISO timestamp
  source: 'auto' | 'push' | 'manual';
}

export interface SiteSettings {
  cronHour: number;    // 0-23 UTC hour to generate
  enabled: boolean;
  adminPasswordHash: string; // simple bcrypt/sha hash, or leave empty to use env
}

export const DEFAULT_SETTINGS: SiteSettings = {
  cronHour: 1,  // 1am UTC = 9am CST
  enabled: true,
  adminPasswordHash: '',
};

// ── Digests ────────────────────────────────────────────────────────────────

export async function saveDigest(entry: DigestEntry): Promise<void> {
  await put(
    `${DIGEST_PREFIX}${entry.date}.json`,
    JSON.stringify(entry, null, 2),
    { access: 'private', contentType: 'application/json', addRandomSuffix: false }
  );
}

export async function getDigest(date: string): Promise<DigestEntry | null> {
  try {
    const result = await get(`${DIGEST_PREFIX}${date}.json`, { access: 'private' });
    if (!result) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as DigestEntry;
  } catch {
    return null;
  }
}

export async function listDigestDates(): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix: DIGEST_PREFIX });
    return blobs
      .map(b => b.pathname.replace(DIGEST_PREFIX, '').replace('.json', ''))
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort((a, b) => b.localeCompare(a)); // newest first
  } catch {
    return [];
  }
}

export async function getLatestDate(): Promise<string | null> {
  const dates = await listDigestDates();
  return dates[0] ?? null;
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<SiteSettings> {
  try {
    const result = await get(SETTINGS_KEY, { access: 'private' });
    if (!result) return DEFAULT_SETTINGS;
    const text = await new Response(result.stream).text();
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(text) as Partial<SiteSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<SiteSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await put(SETTINGS_KEY, JSON.stringify(updated, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}
