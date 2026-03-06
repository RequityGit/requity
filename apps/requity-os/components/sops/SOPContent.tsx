"use client";

import { useMemo, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function extractTOC(markdown: string): TOCItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TOCItem[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    items.push({ id, text, level });
  }
  return items;
}

interface SOPContentProps {
  content: string;
}

export function SOPContent({ content }: SOPContentProps) {
  const toc = useMemo(() => extractTOC(content), [content]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 }
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="flex gap-8">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="sop-prose prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSlug]}
            components={{
              h1: (props) => (
                <h1 className="text-2xl font-semibold text-foreground mt-8 mb-4" {...props} />
              ),
              h2: (props) => (
                <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2" {...props} />
              ),
              h3: (props) => (
                <h3 className="text-lg font-medium text-foreground mt-5 mb-2" {...props} />
              ),
              p: (props) => (
                <p className="mb-3 leading-relaxed text-muted-foreground" {...props} />
              ),
              ul: (props) => (
                <ul className="mb-3 ml-4 list-disc space-y-1 text-muted-foreground" {...props} />
              ),
              ol: (props) => (
                <ol className="mb-3 ml-4 list-decimal space-y-1 text-muted-foreground" {...props} />
              ),
              li: (props) => (
                <li className="text-muted-foreground" {...props} />
              ),
              a: (props) => (
                <a className="text-primary hover:text-foreground underline" target="_blank" rel="noopener noreferrer" {...props} />
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-muted-foreground"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={`font-mono text-sm ${className ?? ""}`} {...props}>
                    {children}
                  </code>
                );
              },
              pre: (props) => (
                <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm text-foreground" {...props} />
              ),
              table: (props) => (
                <div className="mb-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm" {...props} />
                </div>
              ),
              thead: (props) => (
                <thead className="bg-muted text-foreground" {...props} />
              ),
              th: (props) => (
                <th className="px-3 py-2 text-left font-medium" {...props} />
              ),
              td: (props) => (
                <td className="border-t border-border px-3 py-2 text-muted-foreground" {...props} />
              ),
              blockquote: (props) => (
                <blockquote className="mb-4 border-l-4 border-border pl-4 italic text-muted-foreground" {...props} />
              ),
              hr: () => (
                <hr className="my-6 border-t border-border" />
              ),
              strong: (props) => (
                <strong className="font-semibold text-foreground" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Table of contents sidebar */}
      {toc.length > 0 && (
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              On this page
            </h4>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block rounded px-2 py-1 text-sm transition ${
                    item.level === 3 ? "pl-5" : ""
                  } ${
                    activeId === item.id
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
