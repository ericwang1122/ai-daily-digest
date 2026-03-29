import { NextResponse } from 'next/server';
import { generateDigest } from '@/lib/generate';
import { saveDigest, getDigest } from '@/lib/storage';
import { todayUTC } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const force = body.force === true;
  const date = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : todayUTC();

  const existing = await getDigest(date);
  if (existing && !force) {
    return NextResponse.json({ skipped: true, reason: 'already exists', date });
  }

  try {
    const content = await generateDigest('bilingual');
    await saveDigest({ date, content, generatedAt: new Date().toISOString(), source: 'manual' });
    return NextResponse.json({ ok: true, date });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
