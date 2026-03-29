import { NextResponse } from 'next/server';
import { generateDigest } from '@/lib/generate';
import { saveDigest, getSettings, getDigest } from '@/lib/storage';
import { todayUTC } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  // Auth: Vercel CRON_SECRET header OR external secret via query param
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');

  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isExternalCron = querySecret && querySecret === process.env.CRON_API_SECRET;

  if (!isVercelCron && !isExternalCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getSettings();
  if (!settings.enabled) {
    return NextResponse.json({ skipped: true, reason: 'disabled' });
  }

  const date = todayUTC();

  // Skip if we already have today's digest
  const existing = await getDigest(date);
  if (existing) {
    return NextResponse.json({ skipped: true, reason: 'already generated today', date });
  }

  try {
    const content = await generateDigest('bilingual');
    await saveDigest({ date, content, generatedAt: new Date().toISOString(), source: 'auto' });
    return NextResponse.json({ ok: true, date });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
