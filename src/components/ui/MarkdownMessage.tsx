import { Fragment } from 'react';

interface MarkdownMessageProps {
    content: string;
}

function parseInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // Combined regex: bold (**), italic (*), inline code (`), URL
    const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|(https?:\/\/[^\s]+))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (match[2] !== undefined) {
            // Bold: **text**
            nodes.push(<strong key={match.index}>{match[2]}</strong>);
        } else if (match[3] !== undefined) {
            // Italic: *text*
            nodes.push(<em key={match.index}>{match[3]}</em>);
        } else if (match[4] !== undefined) {
            // Inline code: `code`
            nodes.push(
                <code
                    key={match.index}
                    className="bg-muted px-1 rounded text-xs font-mono"
                >
                    {match[4]}
                </code>
            );
        } else if (match[5] !== undefined) {
            // URL
            nodes.push(
                <a
                    key={match.index}
                    href={match[5]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-solar transition-colors"
                >
                    {match[5]}
                </a>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
    // Split into paragraphs on double newline
    const paragraphs = content.split(/\n\n+/);

    return (
        <div className="space-y-2 text-sm leading-relaxed">
            {paragraphs.map((paragraph, pIdx) => {
                const lines = paragraph.split('\n');

                // Check if this paragraph is a list
                const isListParagraph = lines.every(l => /^[-•*]\s/.test(l.trim()) || l.trim() === '');
                if (isListParagraph && lines.some(l => /^[-•*]\s/.test(l.trim()))) {
                    const items = lines.filter(l => /^[-•*]\s/.test(l.trim()));
                    return (
                        <ul key={pIdx} className="list-none space-y-1 pl-0">
                            {items.map((item, iIdx) => {
                                const text = item.replace(/^[-•*]\s/, '');
                                return (
                                    <li key={iIdx} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-solar shrink-0" />
                                        <span>{parseInline(text)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }

                // Mixed lines (some list, some not): render line by line
                const hasListLines = lines.some(l => /^[-•*]\s/.test(l.trim()));
                if (hasListLines) {
                    return (
                        <Fragment key={pIdx}>
                            {lines.map((line, lIdx) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;
                                if (/^[-•*]\s/.test(trimmed)) {
                                    const text = trimmed.replace(/^[-•*]\s/, '');
                                    return (
                                        <div key={lIdx} className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-solar shrink-0" />
                                            <span>{parseInline(text)}</span>
                                        </div>
                                    );
                                }
                                return <p key={lIdx}>{parseInline(trimmed)}</p>;
                            })}
                        </Fragment>
                    );
                }

                // Plain paragraph (may have single newlines)
                const inlineContent = lines
                    .map((line, lIdx) => (
                        <Fragment key={lIdx}>
                            {lIdx > 0 && <br />}
                            {parseInline(line)}
                        </Fragment>
                    ));

                return <p key={pIdx}>{inlineContent}</p>;
            })}
        </div>
    );
}
