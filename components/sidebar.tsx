import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';

interface SidebarProps {
  dates: string[];
  currentDate: string;
}

export function Sidebar({ dates, currentDate }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-48 shrink-0 border-r border-border bg-muted/30 flex-col">
      <div className="px-4 py-5 border-b border-border">
        <Link href="/" className="block">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            AI Daily
          </span>
          <h1 className="text-base font-semibold text-foreground leading-tight mt-0.5">
            Digest
          </h1>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-4 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Archive
        </p>
        {dates.length === 0 ? (
          <p className="px-4 text-xs text-muted-foreground">No digests yet</p>
        ) : (
          <ul className="space-y-0.5">
            {dates.map((date) => {
              const isActive = date === currentDate;
              const [year, month, day] = date.split('-');
              return (
                <li key={date}>
                  <Link
                    href={`/${date}`}
                    className={cn(
                      'block px-4 py-2 text-xs transition-colors',
                      isActive
                        ? 'bg-foreground text-background font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <span className="font-mono">{month}/{day}</span>
                    <span className="text-[10px] ml-1 opacity-60">{year}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <Link
          href="/admin"
          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Admin
        </Link>
      </div>
    </aside>
  );
}
