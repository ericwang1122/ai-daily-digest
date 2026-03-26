'use client';

import { useState } from 'react';

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
  const [generating, setGenerating] = useState(false);
  const [forceGenerate, setForceGenerate] = useState(false);

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

  async function generateToday() {
    setGenerating(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ force: forceGenerate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      if (data.skipped) {
        setStatus({ type: 'error', msg: `Today's digest already exists (${data.date}). Enable "Force regenerate" to overwrite.` });
      } else {
        setStatus({ type: 'success', msg: `Digest generated for ${data.date}` });
        setForceGenerate(false);
      }
    } catch (e) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Generation failed' });
    } finally {
      setGenerating(false);
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
                The cron job runs daily and generates at the configured UTC hour.
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

        {/* Generate Today */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-2 mb-5">
            Generate Today&apos;s Digest
          </h2>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Trigger AI generation for today&apos;s digest immediately. This fetches the latest builder
              updates and produces a bilingual summary — takes about 1–2 minutes.
            </p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceGenerate}
                onChange={(e) => setForceGenerate(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-xs text-foreground">Force regenerate (overwrite if already exists)</span>
            </label>
            <button
              onClick={generateToday}
              disabled={generating}
              className="px-4 py-2 text-xs font-medium bg-foreground text-background rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {generating ? 'Generating… (this may take 1–2 min)' : 'Generate now'}
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
              ['CRON_SECRET', 'Vercel cron job secret (auto on Vercel)'],
              ['GOOGLE_GENERATIVE_AI_API_KEY', 'For server-side digest generation'],
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
