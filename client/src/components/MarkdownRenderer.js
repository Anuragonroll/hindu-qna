import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const wrapStyle = { overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '100%' };

const MarkdownRenderer = ({ content, stripCodeBlocks = false }) => {
  return (
    <div style={wrapStyle} className="markdown-body">
      <ReactMarkdown
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            if (stripCodeBlocks) {
              return <span style={wrapStyle}>{children}</span>;
            }
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '100%' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            return <code className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} {...props}>{children}</code>;
          },
          p: ({ children }) => <p style={wrapStyle}>{children}</p>,
          pre: ({ children }) => <pre style={wrapStyle}>{children}</pre>,
          hr: () => <hr className="my-3 border-gray-200" />,
          em: ({ children }) => <em className="text-gray-500 text-xs">{children}</em>
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

