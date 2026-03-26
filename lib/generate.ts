/**
 * Server-side digest generation.
 * Fetches the same public feeds as the local skill, then uses AI SDK to remix.
 */
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const FEED_X_URL =
  'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json';
const FEED_PODCASTS_URL =
  'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json';
const PROMPTS_BASE =
  'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/prompts';

interface FeedX {
  x: Array<{
    name: string;
    handle: string;
    bio: string;
    tweets: Array<{
      id: string;
      text: string;
      url: string;
      likes: number;
      createdAt: string;
    }>;
  }>;
  generatedAt: string;
}

interface FeedPodcasts {
  podcasts: Array<{
    name: string;
    title: string;
    url: string;
    transcript: string;
    publishedAt: string;
  }>;
  generatedAt: string;
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export async function generateDigest(language: 'en' | 'zh' | 'bilingual' = 'bilingual'): Promise<string> {
  const [feedX, feedPodcasts, promptTweets, promptPodcast, promptIntro, promptTranslate] =
    await Promise.all([
      fetchJSON<FeedX>(FEED_X_URL),
      fetchJSON<FeedPodcasts>(FEED_PODCASTS_URL),
      fetchText(`${PROMPTS_BASE}/summarize-tweets.md`),
      fetchText(`${PROMPTS_BASE}/summarize-podcast.md`),
      fetchText(`${PROMPTS_BASE}/digest-intro.md`),
      fetchText(`${PROMPTS_BASE}/translate.md`),
    ]);

  if (!feedX && !feedPodcasts) {
    throw new Error('Could not fetch any content feeds');
  }

  const todayDate = new Date().toISOString().slice(0, 10);

  const systemPrompt = `You are an AI content curator producing a daily digest for AI builders.
Today's date: ${todayDate}
Language mode: ${language}

${promptTweets ?? ''}

${promptPodcast ?? ''}

${promptIntro ?? ''}

${language !== 'en' ? (promptTranslate ?? '') : ''}`;

  const contentBlob = JSON.stringify(
    {
      date: todayDate,
      language,
      x: feedX?.x ?? [],
      podcasts: feedPodcasts?.podcasts ?? [],
      stats: {
        xBuilders: feedX?.x?.length ?? 0,
        podcasts: feedPodcasts?.podcasts?.length ?? 0,
        totalTweets: (feedX?.x ?? []).reduce((s, a) => s + a.tweets.length, 0),
      },
    },
    null,
    2
  );

  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system: systemPrompt,
    prompt: `Here is today's content to remix into a digest:\n\n${contentBlob}\n\nProduce the full digest now, following all instructions above.`,
    maxTokens: 4096,
  });

  return text;
}
