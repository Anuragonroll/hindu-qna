import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ShlokaTag from './ShlokaTag';

const wrapStyle = { overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '100%' };

// Regex matching @BG 3.4, @SB 1.2.3, @CC adi 1.1, etc.
const SHLOKA_REF_REGEX = /@([A-Za-z]{1,20})[\s.]+(\d+)[\s.]+(\d+)(?:[\s.]+(\d+))?/g;

/**
 * Split content text into segments: text parts and shloka reference parts.
 * Each segment is { type: 'text', content: string } or { type: 'shloka', raw: string, shloka: object|null }
 */
function splitContent(content, shlokaReferences) {
  if (!content) return [{ type: 'text', content: '' }];

  // Build a lookup by raw @-reference string (case-insensitive)
  const shlokaMap = {};
  if (shlokaReferences) {
    for (const s of shlokaReferences) {
      if (s.raw) shlokaMap[s.raw.toLowerCase()] = s;
    }
  }

  const segments = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  SHLOKA_REF_REGEX.lastIndex = 0;

  while ((match = SHLOKA_REF_REGEX.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const shloka = shlokaMap[raw.toLowerCase()];
    segments.push({ type: 'shloka', raw, shloka: shloka || null });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content });
  }

  return segments;
}

/**
 * Renders a markdown text segment inline (for fragments within a paragraph).
 * Wraps in a <span> to avoid creating new <p> boundaries.
 */
const InlineMarkdown = ({ content }) => {
  if (!content) return null;
  return (
    <span style={wrapStyle}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <span style={wrapStyle}>{children}</span>,
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="span"
                  customStyle={{ display: 'inline', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '100%', fontSize: '0.75rem' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            return <code className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem' }} {...props}>{children}</code>;
          },
          pre: ({ children }) => <span style={wrapStyle}>{children}</span>,
          h1: ({ children }) => <strong className="text-base">{children}</strong>,
          h2: ({ children }) => <strong className="text-sm">{children}</strong>,
          h3: ({ children }) => <strong>{children}</strong>,
          ul: ({ children }) => <span style={wrapStyle}>{children}</span>,
          ol: ({ children }) => <span style={wrapStyle}>{children}</span>,
          li: ({ children }) => <span className="block" style={wrapStyle}>• {children}</span>,
          blockquote: ({ children }) => <span className="italic text-gray-600 border-l-2 border-gray-300 pl-2" style={wrapStyle}>{children}</span>,
          hr: () => <span className="block border-t border-gray-200 my-1" />,
          em: ({ children }) => <em className="text-gray-500 text-xs">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </span>
  );
};

/**
 * AnswerBodyWithShlokas
 *
 * Renders answer/rich text content, replacing @-shloka references with
 * clickable expandable ShlokaTag components while preserving markdown
 * formatting in the surrounding text.
 */
const AnswerBodyWithShlokas = ({ content, shlokaReferences, stripCodeBlocks }) => {
  const segments = useMemo(
    () => splitContent(content, shlokaReferences),
    [content, shlokaReferences]
  );

  return (
    <div className="text-gray-800 text-sm leading-relaxed break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          if (stripCodeBlocks) {
            return <span key={i} style={wrapStyle}>{seg.content}</span>;
          }
          return <InlineMarkdown key={i} content={seg.content} />;
        }
        // shloka type - if data not found, render raw text as fallback
        if (!seg.shloka) return <span key={i} className="text-orange-700 font-medium">{seg.raw}</span>;
        return <ShlokaTag key={i} shloka={seg.shloka} />;
      })}
    </div>
  );
};

export default AnswerBodyWithShlokas;
