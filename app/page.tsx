import { redirect } from 'next/navigation';
import { getLatestDate, listDigestDates } from '@/lib/storage';
import { Sidebar } from '@/components/sidebar';

export const revalidate = 300;

export default async function HomePage() {
  const [latestDate, allDates] = await Promise.all([getLatestDate(), listDigestDates()]);

  if (latestDate) {
    redirect(`/${latestDate}`);
  }

  // No digests yet — show empty state
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar dates={allDates} currentDate="" />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl">📰</div>
          <h2 className="text-sm font-semibold text-foreground">No digests yet</h2>
          <p className="text-xs text-muted-foreground max-w-xs">
            Push your first digest using the local script, or wait for the scheduled cron to run.
          </p>
          <a
            href="/admin"
            className="inline-block mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Configure schedule
          </a>
        </div>
      </main>
    </div>
  );
}
