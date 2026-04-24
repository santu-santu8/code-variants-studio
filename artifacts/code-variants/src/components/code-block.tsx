import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  // Use a simple dark theme, remove border-radius and match our app background
  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: '1.25rem',
      textShadow: 'none',
      borderRadius: 0,
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      fontFamily: 'var(--app-font-mono)',
      fontSize: '0.875rem',
      textShadow: 'none',
    },
  };

  return (
    <div className="bg-[#1e1e1e] border border-border/50 w-full overflow-x-auto">
      <SyntaxHighlighter
        language={language.toLowerCase()}
        style={customStyle}
        showLineNumbers={true}
        lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: 'hsl(var(--muted-foreground))', textAlign: 'right' }}
        wrapLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
