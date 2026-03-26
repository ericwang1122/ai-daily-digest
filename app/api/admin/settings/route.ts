import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/storage';

export const runtime = 'nodejs';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;
  return authHeader === `Bearer ${adminSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const settings = await getSettings();
  // Don't expose password hash
  const { adminPasswordHash: _, ...safe } = settings;
  return NextResponse.json(safe);
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.cronHour === 'number' && body.cronHour >= 0 && body.cronHour <= 23) {
    updates.cronHour = body.cronHour;
  }
  if (typeof body.enabled === 'boolean') {
    updates.enabled = body.enabled;
  }

  await saveSettings(updates);
  const settings = await getSettings();
  const { adminPasswordHash: _, ...safe } = settings;
  return NextResponse.json({ ok: true, settings: safe });
}
