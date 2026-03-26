import { notFound } from 'next/navigation';
import { getDigest, listDigestDates } from '@/lib/storage';
import { isValidDate } from '@/lib/utils';
import { Sidebar } from '@/components/sidebar';
import { DigestContent } from '@/components/digest-content';

export const revalidate = 300;

export async function generateStaticParams() {
  const dates = await listDigestDates();
  return dates.map((date) => ({ date }));
}

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function DigestPage({ params }: PageProps) {
  const { date } = await params;

  if (!isValidDate(date)) notFound();

  const [digest, allDates] = await Promise.all([getDigest(date), listDigestDates()]);

  if (!digest) notFound();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar dates={allDates} currentDate={date} />
      <DigestContent
        date={digest.date}
        content={digest.content}
        generatedAt={digest.generatedAt}
        dates={allDates}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { date } = await params;
  return {
    title: `AI Daily Digest — ${date}`,
  };
}
