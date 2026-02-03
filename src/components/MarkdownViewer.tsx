'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-[var(--text-primary)] mt-6 mb-3 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-5 mb-2 border-b border-[var(--border-subtle)] pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-medium text-[var(--text-primary)] mt-4 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-medium text-[var(--text-primary)] mt-3 mb-1">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[var(--text-secondary)] leading-relaxed my-2">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="text-[var(--text-primary)] font-semibold">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="my-2 space-y-1 list-none">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 space-y-1 list-none counter-reset-item">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => {
    const isOrdered = props.node?.position?.start.column === 1 &&
      typeof children === 'object';
    return (
      <li className="flex gap-2">
        <span className="text-[var(--accent-cyan)] shrink-0">
          {isOrdered ? '' : '•'}
        </span>
        <span>{children}</span>
      </li>
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--accent-cyan)] hover:underline"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--accent-purple)] pl-4 my-3 text-[var(--text-tertiary)] italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--accent-cyan)] text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] overflow-x-auto">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--bg-tertiary)]">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-[var(--border-subtle)]">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left text-sm font-semibold text-[var(--text-primary)]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-sm text-[var(--text-secondary)]">
      {children}
    </td>
  ),
  hr: () => (
    <hr className="my-4 border-[var(--border-subtle)]" />
  ),
};

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  return (
    <div className={`markdown-content ${className}`} style={{ fontFamily: 'var(--font-space)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
