'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDate, formatDateCN } from '@/lib/utils';

interface DigestContentProps {
  date: string;
  content: string;
  generatedAt: string;
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

      <div className="px-8 py-8 max-w-2xl">
        <div className="digest-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Strip the top-level "AI Builders Digest — date" heading since we show it in header
              h1: ({ children }) => (
                <p className="text-xs font-mono text-muted-foreground mb-6 pb-4 border-b border-border">
                  {children}
                </p>
              ),
              h2: ({ children }) => (
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-4 mt-10 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <div className="mt-10 mb-3 pt-6 border-t-2 border-border">
                  <h3 className="text-sm font-semibold text-foreground leading-snug pl-3 border-l-2 border-foreground/40">
                    {children}
                  </h3>
                </div>
              ),
              p: ({ children }) => (
                <p className="text-sm leading-relaxed text-foreground/85 mb-3 pl-3">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors break-all pl-3 mb-4"
                >
                  {children}
                </a>
              ),
              hr: () => <hr className="border-border my-10" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground text-sm my-3">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <code className="block font-mono text-xs bg-muted p-4 rounded overflow-x-auto my-3">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
