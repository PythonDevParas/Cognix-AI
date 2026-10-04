import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse content into blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="text-neutral-800 text-[15px] leading-relaxed space-y-3 font-normal break-words">
      {blocks.map((block, idx) => (
        <RenderBlock key={idx} block={block} />
      ))}
    </div>
  );
};

interface Block {
  type: 'paragraph' | 'heading' | 'code' | 'list' | 'table' | 'quote' | 'hr';
  content?: string;
  level?: number;
  language?: string;
  items?: string[];
  ordered?: boolean;
  rows?: string[][];
  headers?: string[];
}

function parseMarkdownBlocks(text: string): Block[] {
  if (!text) return [];

  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^(\*\*\*|---|___)\s*$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Code blocks ```lang
    if (line.trim().startsWith('```')) {
      const language = line.trim().replace(/^```/, '').trim() || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        language,
        content: codeLines.join('\n'),
      });
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // Unordered List
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        ordered: false,
        items,
      });
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        ordered: true,
        items,
      });
      continue;
    }

    // Markdown Table
    if (line.includes('|') && lines[i + 1] && /^\s*\|?[-:\s|]+\|?\s*$/.test(lines[i + 1])) {
      const headers = line.split('|').map((c) => c.trim()).filter(Boolean);
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i].split('|').map((c) => c.trim()).filter(Boolean);
        if (row.length > 0) rows.push(row);
        i++;
      }
      blocks.push({
        type: 'table',
        headers,
        rows,
      });
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Normal paragraph
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: 'paragraph',
      content: paraLines.join('\n'),
    });
  }

  return blocks;
}

const RenderBlock: React.FC<{ block: Block }> = ({ block }) => {
  if (block.type === 'heading') {
    switch (block.level) {
      case 1:
        return (
          <h1 className="text-xl font-bold text-neutral-900 mt-4 mb-2 pb-1 border-b border-neutral-200">
            <InlineText text={block.content || ''} />
          </h1>
        );
      case 2:
        return (
          <h2 className="text-lg font-semibold text-neutral-900 mt-3 mb-2">
            <InlineText text={block.content || ''} />
          </h2>
        );
      case 3:
        return (
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">
            <InlineText text={block.content || ''} />
          </h3>
        );
      default:
        return (
          <h4 className="text-sm font-semibold text-neutral-800 mt-2 mb-1">
            <InlineText text={block.content || ''} />
          </h4>
        );
    }
  }

  if (block.type === 'code') {
    return <CodeBlock language={block.language || 'text'} code={block.content || ''} />;
  }

  if (block.type === 'list') {
    if (block.ordered) {
      return (
        <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2 text-neutral-800">
          {block.items?.map((item, idx) => (
            <li key={idx} className="pl-1">
              <InlineText text={item} />
            </li>
          ))}
        </ol>
      );
    }
    return (
      <ul className="list-disc list-outside pl-5 space-y-1.5 my-2 text-neutral-800">
        {block.items?.map((item, idx) => (
          <li key={idx} className="pl-1">
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-4 border-neutral-300 pl-4 py-1 my-2 italic text-neutral-600 bg-neutral-50 rounded-r-md">
        <InlineText text={block.content || ''} />
      </blockquote>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="overflow-x-auto my-3 border border-neutral-200 rounded-lg">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          {block.headers && block.headers.length > 0 && (
            <thead className="bg-neutral-50">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 text-left font-semibold text-neutral-900">
                    <InlineText text={h} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-neutral-100 bg-white">
            {block.rows?.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-neutral-50/50' : ''}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-neutral-700">
                    <InlineText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === 'hr') {
    return <hr className="my-4 border-neutral-200" />;
  }

  return (
    <p className="my-1.5 leading-relaxed text-neutral-800">
      <InlineText text={block.content || ''} />
    </p>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-neutral-800 bg-[#18181b] shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#27272a] text-neutral-300 text-xs border-b border-neutral-700/60">
        <span className="font-mono lowercase font-medium text-neutral-300">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-700 transition text-xs font-medium cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-neutral-100 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Inline parser for bold, italics, inline code, and links
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {codeParts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 text-[13px] font-mono bg-neutral-100 text-neutral-800 border border-neutral-200/80 rounded"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Process markdown bold, italic, links inside normal text
        return <FormattedSubText key={i} text={part} />;
      })}
    </>
  );
};

const FormattedSubText: React.FC<{ text: string }> = ({ text }) => {
  // Regex to match bold: **text** or __text__
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((p, idx) => {
        if ((p.startsWith('**') && p.endsWith('**')) || (p.startsWith('__') && p.endsWith('__'))) {
          return (
            <strong key={idx} className="font-semibold text-neutral-900">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if ((p.startsWith('*') && p.endsWith('*')) || (p.startsWith('_') && p.endsWith('_'))) {
          return (
            <em key={idx} className="italic text-neutral-800">
              {p.slice(1, -1)}
            </em>
          );
        }
        // Link [label](url)
        const linkMatch = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={idx}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              {linkMatch[1]}
            </a>
          );
        }

        return <span key={idx}>{p}</span>;
      })}
    </>
  );
};
