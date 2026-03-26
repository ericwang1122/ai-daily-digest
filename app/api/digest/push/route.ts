import { NextResponse } from 'next/server';
import { saveDigest } from '@/lib/storage';
import { isValidDate } from '@/lib/utils';

export const runtime = 'nodejs';

/**
 * POST /api/digest/push
 * Body: { date: "YYYY-MM-DD", content: "<markdown>", secret: "<PUSH_SECRET>" }
 *
 * Used by the local push script to publish a digest generated on the local machine.
 */
export async function POST(request: Request) {
  const secret = process.env.PUSH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'PUSH_SECRET not configured' }, { status: 500 });
  }

  let body: { date?: string; content?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date, content } = body;

  if (!date || !isValidDate(date)) {
    return NextResponse.json({ error: 'Invalid or missing date (expected YYYY-MM-DD)' }, { status: 400 });
  }

  if (!content || content.trim().length < 10) {
    return NextResponse.json({ error: 'Content is empty or too short' }, { status: 400 });
  }

  await saveDigest({
    date,
    content: content.trim(),
    generatedAt: new Date().toISOString(),
    source: 'push',
  });

  return NextResponse.json({ ok: true, date });
}
