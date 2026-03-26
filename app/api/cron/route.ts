import { NextResponse } from 'next/server';
import { generateDigest } from '@/lib/generate';
import { saveDigest, getSettings, getDigest } from '@/lib/storage';
import { todayUTC } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getSettings();
  if (!settings.enabled) {
    return NextResponse.json({ skipped: true, reason: 'disabled' });
  }

  // Check if we should run at this hour
  const currentHour = new Date().getUTCHours();
  if (currentHour !== settings.cronHour) {
    return NextResponse.json({
      skipped: true,
      reason: `not the right hour (current=${currentHour}, target=${settings.cronHour})`,
    });
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
