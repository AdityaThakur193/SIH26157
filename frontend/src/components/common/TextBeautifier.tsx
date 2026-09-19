import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TextBeautifierProps {
  content: string;
  isUser?: boolean;
}

export const TextBeautifier: React.FC<TextBeautifierProps> = ({ content, isUser }) => {
  if (isUser) {
    return <p className="whitespace-pre-line text-xs leading-relaxed">{content}</p>;
  }

  return (
    <div className="text-xs leading-relaxed space-y-3 text-slate-800 prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 mt-2 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 mt-2 mb-1.5 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mt-3 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 leading-relaxed text-slate-700 text-xs last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => {
            const textStr = String(children);
            // Highlight cluster titles or key terms with cybernetic styling
            if (textStr.toLowerCase().includes('cluster')) {
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 my-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono font-bold text-[11px] shadow-2xs">
                  {children}
                </span>
              );
            }
            if (textStr.toLowerCase().includes('malware') || textStr.toLowerCase().includes('attack') || textStr.toLowerCase().includes('critical')) {
              return (
                <strong className="font-bold text-rose-700">
                  {children}
                </strong>
              );
            }
            return <strong className="font-bold text-slate-900">{children}</strong>;
          },
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2 list-decimal pl-4 text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-slate-700 text-xs">
              <span className="text-indigo-500 font-bold mt-0.5">•</span>
              <span className="flex-1 leading-relaxed">{children}</span>
            </li>
          ),
          code: ({ children, className }) => {
            const isMultiLine = String(children).includes('\n');
            if (isMultiLine) {
              return (
                <pre className="p-3 my-2 rounded-xl bg-slate-900 text-indigo-200 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-indigo-700 font-mono text-[11px] rounded-md border border-slate-200">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-indigo-500 pl-3 py-1 my-2 bg-indigo-50/50 rounded-r-lg text-slate-600 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-50 p-2.5 font-bold text-slate-700 border-b border-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 border-b border-slate-100 text-slate-600">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
