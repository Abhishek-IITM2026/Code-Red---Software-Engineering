import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string | undefined | null;
  className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  if (!content) return null;

  return (
    <div className={`prose prose-slate max-w-none ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="mb-3 text-2xl font-bold tracking-tight text-slate-950">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-5 text-xl font-semibold text-slate-900">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900">{children}</h3>,
          p: ({ children }) => <p className="mb-4 leading-7 text-slate-700 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-1.5 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-1.5 text-slate-700">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-2xl border-l-4 border-[var(--primary)] bg-[var(--secondary)]/60 px-4 py-3 text-slate-700">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-slate-200" />,
          code: ({ className, children, ...props }) => {
            const textContent = String(children).replace(/\n$/, '');
            const isInlineCode = !(className || '').includes('language-') && !textContent.includes('\n');
            return isInlineCode ? (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono text-rose-600" {...props}>
                {children}
              </code>
            ) : (
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto my-4">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--primary)] underline decoration-[var(--primary)]/30 underline-offset-4 hover:decoration-[var(--primary)]"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50 text-slate-700">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-3 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 align-top text-slate-700">{children}</td>,
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || 'AI generated image'}
              className="my-4 rounded-xl max-w-full h-auto border border-slate-200 shadow-sm"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
