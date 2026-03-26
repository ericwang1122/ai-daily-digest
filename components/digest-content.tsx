'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDate, formatDateCN } from '@/lib/utils';

interface DigestContentProps {
  date: string;
  content: string;
  generatedAt: string;
}

const bodyComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed text-foreground/85 mb-2 last:mb-0">{children}</p>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-[11px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors break-all mt-0.5 mb-3"
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-foreground/85">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
};

const structureComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-xs font-mono text-muted-foreground mb-6 pb-4 border-b border-border">
      {children}
    </p>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-4 mt-10 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-foreground mb-2 mt-6">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed text-foreground/85 mb-3">{children}</p>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-[11px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors break-all mb-3"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-border my-8" />,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
};

interface Block {
  type: 'structure' | 'person';
  text: string;
}

function parseBlocks(content: string): Block[] {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const blocks: Block[] = [];
  let personLines: string[] = [];

  function flushPerson() {
    if (personLines.length > 0) {
      blocks.push({ type: 'person', text: personLines.join('\n\n') });
      personLines = [];
    }
  }

  for (const para of paragraphs) {
    const isHeading = para.startsWith('#');
    const isDivider = /^-{3,}$/.test(para);
    const isPersonStart = para.startsWith('**') && !isHeading;

    if (isHeading || isDivider) {
      flushPerson();
      blocks.push({ type: 'structure', text: para });
    } else if (isPersonStart) {
      flushPerson();
      personLines = [para];
    } else if (personLines.length > 0) {
      personLines.push(para);
    } else {
      blocks.push({ type: 'structure', text: para });
    }
  }
  flushPerson();

  return blocks;
}

const NO_CONTENT_PATTERNS = [
  /no notable posts?/i,
  /no posts? this (week|period|day)/i,
  /nothing notable/i,
  /no updates?/i,
  /^no\b/i,
];

function hasNoContent(body: string) {
  const trimmed = body.trim();
  return trimmed.length < 60 && NO_CONTENT_PATTERNS.some((re) => re.test(trimmed));
}

function PersonCard({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const first = paragraphs[0] ?? '';

  // Extract **Name** from start of first paragraph
  const nameMatch = first.match(/^\*\*([^*]+)\*\*/);
  const name = nameMatch?.[1] ?? '';
  const afterName = nameMatch ? first.slice(nameMatch[0].length).trim() : first;
  const bodyParts = [afterName, ...paragraphs.slice(1)].filter(Boolean);
  const bodyMarkdown = bodyParts.join('\n\n');

  if (hasNoContent(bodyMarkdown)) return null;

  return (
    <div className="rounded-lg border border-border/60 px-5 pt-4 pb-3 mb-2.5">
      {name && (
        <p className="text-[13px] font-semibold text-foreground mb-3">{name}</p>
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={bodyComponents}>
        {bodyMarkdown}
      </ReactMarkdown>
    </div>
  );
}

export function DigestContent({ date, content, generatedAt }: DigestContentProps) {
  const blocks = parseBlocks(content);

  return (
    <article className="flex-1 min-w-0 overflow-y-auto">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-8 py-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{formatDate(date)}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateCN(date)}</p>
        </div>
        <time className="text-[10px] font-mono text-muted-foreground" dateTime={generatedAt}>
          {new Date(generatedAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
          })}
        </time>
      </header>

      <div className="px-8 py-8">
        {blocks.map((block, i) =>
          block.type === 'person' ? (
            <PersonCard key={i} text={block.text} />
          ) : (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={structureComponents}>
              {block.text}
            </ReactMarkdown>
          )
        )}
      </div>
    </article>
  );
}
