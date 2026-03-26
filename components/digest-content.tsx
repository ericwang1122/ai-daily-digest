'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDate, formatDateCN } from '@/lib/utils';

interface DigestContentProps {
  date: string;
  content: string;
  generatedAt: string;
}

const sharedComponents = {
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
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-foreground/85">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (className?.includes('language-')) {
      return <code className="block font-mono text-xs bg-muted p-4 rounded overflow-x-auto my-3">{children}</code>;
    }
    return <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{children}</code>;
  },
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground text-sm my-3">
      {children}
    </blockquote>
  ),
};

// Outer-level components (h1, h2, hr — not inside a person card)
const outerComponents = {
  ...sharedComponents,
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
  hr: () => <hr className="border-border my-10" />,
};

// Person-card components (h3 is the person name, inside the card)
const personComponents = {
  ...sharedComponents,
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-foreground mb-3 leading-snug">
      {children}
    </h3>
  ),
};

function renderDigest(content: string) {
  // Split into chunks: outer content and person (###) blocks
  const lines = content.split('\n');
  const chunks: { type: 'outer' | 'person'; text: string }[] = [];
  let current: string[] = [];
  let currentType: 'outer' | 'person' = 'outer';

  for (const line of lines) {
    if (line.startsWith('### ')) {
      // Save previous chunk
      if (current.length > 0) {
        chunks.push({ type: currentType, text: current.join('\n') });
      }
      current = [line];
      currentType = 'person';
    } else if ((line.startsWith('## ') || line.startsWith('# ') || line.startsWith('---')) && currentType === 'person') {
      // Section break — end the person block
      chunks.push({ type: 'person', text: current.join('\n') });
      current = [line];
      currentType = 'outer';
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    chunks.push({ type: currentType, text: current.join('\n') });
  }

  return chunks.map((chunk, i) => {
    if (chunk.type === 'person') {
      return (
        <div
          key={i}
          className="rounded-lg border border-border bg-muted/30 px-5 py-4 mb-3"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={personComponents}>
            {chunk.text}
          </ReactMarkdown>
        </div>
      );
    }
    return (
      <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={outerComponents}>
        {chunk.text}
      </ReactMarkdown>
    );
  });
}

export function DigestContent({ date, content, generatedAt }: DigestContentProps) {
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

      <div className="px-8 py-8 max-w-2xl space-y-0">
        {renderDigest(content)}
      </div>
    </article>
  );
}
