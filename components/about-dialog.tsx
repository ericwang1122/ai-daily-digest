'use client';

import { useState } from 'react';

export function AboutDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors text-left"
      >
        数据来源
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background border border-border rounded-lg w-80 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">关于数据来源</h2>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                本站每日追踪 AI 领域真正在<strong className="text-foreground">构建产品、运营公司、做研究</strong>的一线建设者，而非仅仅传播信息的 KOL。
              </p>
              <p>
                内容来源于他们在 <strong className="text-foreground">X (Twitter)</strong> 上的最新动态与<strong className="text-foreground">播客访谈</strong>，每日由 AI 自动抓取、筛选并整理为中英双语摘要。
              </p>
              <p>
                数据由开源项目{' '}
                <a
                  href="https://github.com/zarazhangrui/follow-builders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  follow-builders
                </a>{' '}
                提供，持续更新维护中。
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
