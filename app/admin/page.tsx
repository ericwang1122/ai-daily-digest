'use client';

import { useState, useEffect } from 'react';

const UTC_HOURS = Array.from({ length: 24 }, (_, i) => i);

function toLocalTime(utcHour: number): string {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [cronHour, setCronHour] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pushSecret, setPushSecret] = useState('');
  const [pushDate, setPushDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pushContent, setPushContent] = useState('');
  const [pushing, setPushing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!res.ok) {
        setStatus({ type: 'error', msg: 'Wrong password' });
        return;
      }
      const data = await res.json();
      setCronHour(data.cronHour ?? 1);
      setEnabled(data.enabled ?? true);
      setAuthed(true);
      setStatus(null);
    } catch {
      setStatus({ type: 'error', msg: 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ cronHour, enabled }),
      });
      if (!res.ok) throw new Error('Save failed');
      setStatus({ type: 'success', msg: 'Settings saved' });
    } catch {
      setStatus({ type: 'error', msg: 'Failed to save' });
    } finally {
      setLoading(false);
    }
  }

  async function pushDigest() {
    if (!pushContent.trim()) return;
    setPushing(true);
    setStatus(null);
    try {
      const res = await fetch('/api/digest/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: pushDate, content: pushContent, secret: pushSecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Push failed');
      setStatus({ type: 'success', msg: `Pushed digest for ${data.date}` });
      setPushContent('');
    } catch (e) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Push failed' });
    } finally {
      setPushing(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-72 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
              Admin
            </p>
            <h1 className="text-sm font-semibold text-foreground">AI Daily Digest</h1>
          </div>
          <div className="space-y-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Admin password"
              className="w-full px-3 py-2 text-sm border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            {status && (
              <p className="text-xs text-red-500">{status.msg}</p>
            )}
            <button
              onClick={load}
              disabled={loading || !secret}
              className="w-full px-3 py-2 text-xs font-medium bg-foreground text-background rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-8 py-4 flex items-center justify-between">
        <div>
          <a href="/" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </a>
          <h1 className="text-sm font-semibold text-foreground mt-1">Admin Settings</h1>
        </div>
      </header>

      <main className="px-8 py-8 max-w-lg space-y-10">
        {status && (
          <div className={`text-xs px-3 py-2 rounded border ${
            status.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {status.msg}
          </div>
        )}

        {/* Schedule Settings */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-2 mb-5">
            Schedule
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Auto-generate enabled</label>
              <button
                onClick={() => setEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  enabled ? 'bg-foreground' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-background shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm text-foreground mb-2">
                Generation time (UTC)
              </label>
              <select
                value={cronHour}
                onChange={(e) => setCronHour(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                {UTC_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00 UTC
                    {' '}({toLocalTime(h)} local)
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                The cron job runs hourly and generates when the hour matches.
              </p>
            </div>

            <button
              onClick={save}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium bg-foreground text-background rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </section>

        {/* Manual Push */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-2 mb-5">
            Manual Push
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={pushDate}
                onChange={(e) => setPushDate(e.target.value)}
                className="px-3 py-2 text-sm border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Push secret</label>
              <input
                type="password"
                value={pushSecret}
                onChange={(e) => setPushSecret(e.target.value)}
                placeholder="PUSH_SECRET value"
                className="w-full px-3 py-2 text-sm border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Content (markdown)</label>
              <textarea
                value={pushContent}
                onChange={(e) => setPushContent(e.target.value)}
                rows={8}
                placeholder="Paste digest markdown here..."
                className="w-full px-3 py-2 text-xs font-mono border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
              />
            </div>
            <button
              onClick={pushDigest}
              disabled={pushing || !pushContent.trim()}
              className="px-4 py-2 text-xs font-medium bg-foreground text-background rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {pushing ? 'Pushing...' : 'Push digest'}
            </button>
          </div>
        </section>

        {/* Info */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-2 mb-4">
            Environment Variables
          </h2>
          <div className="font-mono text-xs space-y-2 text-muted-foreground">
            {[
              ['BLOB_READ_WRITE_TOKEN', 'Vercel Blob token (auto on Vercel)'],
              ['ADMIN_SECRET', 'Password for this admin page'],
              ['PUSH_SECRET', 'Secret for the /api/digest/push endpoint'],
              ['CRON_SECRET', 'Vercel cron job secret (auto on Vercel)'],
              ['ANTHROPIC_API_KEY', 'For server-side digest generation'],
            ].map(([key, desc]) => (
              <div key={key} className="flex gap-3">
                <span className="text-foreground w-52 shrink-0">{key}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
