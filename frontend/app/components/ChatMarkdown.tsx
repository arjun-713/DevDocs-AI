"use client";

import React, { useMemo, useState, useCallback } from "react";

/* ─────────────────────────────────────────────
   Code Block with language label + copy button
   ───────────────────────────────────────────── */
function CodeBlock({ language, code }: { language: string; code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    const lang = language || "text";

    return (
        <div className="my-3 rounded-xl overflow-hidden border border-gray-200/80 bg-[#0d1117] shadow-sm group">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700/50">
                <span className="text-[11px] font-mono font-medium text-gray-400 uppercase tracking-wider">
                    {lang}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-white transition-colors px-2.5 py-1 rounded-md hover:bg-white/10"
                >
                    {copied ? (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Copied!
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                            Copy
                        </>
                    )}
                </button>
            </div>
            {/* Code content */}
            <div className="px-4 py-3 overflow-x-auto">
                <pre className="text-[13px] leading-relaxed font-mono text-gray-200 whitespace-pre">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Inline markdown: bold, code, italic, links
   ───────────────────────────────────────────── */
function renderInline(text: string, keyPrefix: string = "il"): React.ReactNode[] {
    // Match: **bold**, __bold__, `code`, *italic*, _italic_, [link](url), bare URLs
    const regex = /(\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+`|\[[^\]]+\]\(([^)]+)\)|(?<!\*)\*[^*\n]+?\*(?!\*)|(?<!_)_[^_\n]+?_(?!_)|(https?:\/\/[^\s<)]+))/g;
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }
        const token = match[0];

        if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
            const inner = token.slice(2, -2);
            result.push(
                <strong key={`${keyPrefix}-b-${match.index}`} className="font-bold">
                    {renderInline(inner, `${keyPrefix}-b-in-${match.index}`)}
                </strong>
            );
        } else if (token.startsWith("`") && token.endsWith("`")) {
            result.push(
                <code key={`${keyPrefix}-c-${match.index}`} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-blue-100">{token.slice(1, -1)}</code>
            );
        } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
            const inner = token.slice(1, -1);
            result.push(
                <em key={`${keyPrefix}-i-${match.index}`} className="italic">
                    {renderInline(inner, `${keyPrefix}-i-in-${match.index}`)}
                </em>
            );
        } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            const label = linkMatch?.[1] || token;
            const href = linkMatch?.[2] || "#";
            result.push(
                <a key={`${keyPrefix}-a-${match.index}`} href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium break-all">{label}</a>
            );
        } else if (token.startsWith("http://") || token.startsWith("https://")) {
            result.push(
                <a key={`${keyPrefix}-u-${match.index}`} href={token} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium break-all">{token}</a>
            );
        } else {
            result.push(token);
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }
    return result;
}

/* ─────────────────────────────────────────────
   Full Markdown Renderer
   Handles: code blocks, headers, lists, blockquotes, horizontal rules, paragraphs
   ───────────────────────────────────────────── */
export default function ChatMarkdown({ text }: { text: string }) {
    const rendered = useMemo(() => {
        const elements: React.ReactNode[] = [];
        let i = 0;

        // Split into lines for block-level parsing
        const normalizedText = text.replace(/\r\n?/g, "\n");
        const lines = normalizedText.split("\n");
        let lineIdx = 0;

        const splitTableRow = (row: string) =>
            row
                .trim()
                .replace(/^\|/, "")
                .replace(/\|$/, "")
                .split("|")
                .map((cell) => cell.trim());

        while (lineIdx < lines.length) {
            const line = lines[lineIdx];

            // ── Fenced code blocks ──
            const codeMatch = line.match(/^(```|~~~)\s*([A-Za-z0-9_+#.-]*)\s*$/);
            if (codeMatch) {
                const fence = codeMatch[1];
                const lang = codeMatch[2] || "";
                const codeLines: string[] = [];
                lineIdx++;
                while (lineIdx < lines.length && !lines[lineIdx].startsWith(fence)) {
                    codeLines.push(lines[lineIdx]);
                    lineIdx++;
                }
                lineIdx++; // skip closing ```
                elements.push(
                    <CodeBlock key={`cb-${i++}`} language={lang} code={codeLines.join("\n")} />
                );
                continue;
            }

            // ── Headings ──
            const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const content = headingMatch[2];
                const cls = level === 1 ? "text-xl font-bold mt-4 mb-2" :
                    level === 2 ? "text-lg font-bold mt-3 mb-1.5" :
                        level <= 4 ? "text-base font-bold mt-2 mb-1" :
                            "text-sm font-bold mt-2 mb-1";
                elements.push(
                    <div key={`h-${i++}`} className={cls}>
                        {renderInline(content, `h${i}`)}
                    </div>
                );
                lineIdx++;
                continue;
            }

            // ── Tables (GFM-style) ──
            const nextLine = lines[lineIdx + 1] || "";
            const tableSeparatorRegex = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/;
            if (line.includes("|") && tableSeparatorRegex.test(nextLine)) {
                const header = splitTableRow(line);
                lineIdx += 2; // header + separator
                const rows: string[][] = [];
                while (lineIdx < lines.length && lines[lineIdx].includes("|") && lines[lineIdx].trim() !== "") {
                    rows.push(splitTableRow(lines[lineIdx]));
                    lineIdx++;
                }
                elements.push(
                    <div key={`tbl-${i++}`} className="my-3 overflow-x-auto">
                        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {header.map((cell, idx) => (
                                        <th key={idx} className="px-3 py-2 border-b border-gray-200 text-left font-semibold text-gray-700">
                                            {renderInline(cell, `th-${i}-${idx}`)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="bg-white">
                                        {row.map((cell, colIdx) => (
                                            <td key={colIdx} className="px-3 py-2 border-b border-gray-100 text-gray-700 align-top">
                                                {renderInline(cell, `td-${i}-${rowIdx}-${colIdx}`)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                continue;
            }

            // ── Horizontal rule ──
            if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
                elements.push(<hr key={`hr-${i++}`} className="my-3 border-t border-gray-200" />);
                lineIdx++;
                continue;
            }

            // ── Unordered list items ──
            if (/^\s*[-*+•]\s+/.test(line)) {
                const listItems: string[] = [];
                while (lineIdx < lines.length && /^\s*[-*+•]\s+/.test(lines[lineIdx])) {
                    listItems.push(lines[lineIdx].replace(/^\s*[-*+•]\s+/, ""));
                    lineIdx++;
                }
                elements.push(
                    <ul key={`ul-${i++}`} className="list-disc list-outside pl-5 space-y-1 my-2">
                        {listItems.map((item, j) => (
                            <li key={j} className="text-[15px] leading-relaxed">
                                {renderInline(item, `li-${i}-${j}`)}
                            </li>
                        ))}
                    </ul>
                );
                continue;
            }

            // ── Ordered list items ──
            if (/^\s*\d+[.)]\s+/.test(line)) {
                const listItems: string[] = [];
                while (lineIdx < lines.length && /^\s*\d+[.)]\s+/.test(lines[lineIdx])) {
                    listItems.push(lines[lineIdx].replace(/^\s*\d+[.)]\s+/, ""));
                    lineIdx++;
                }
                elements.push(
                    <ol key={`ol-${i++}`} className="list-decimal list-outside pl-5 space-y-1 my-2">
                        {listItems.map((item, j) => (
                            <li key={j} className="text-[15px] leading-relaxed">
                                {renderInline(item, `oli-${i}-${j}`)}
                            </li>
                        ))}
                    </ol>
                );
                continue;
            }

            // ── Blockquote ──
            if (line.startsWith("> ")) {
                const quoteLines: string[] = [];
                while (lineIdx < lines.length && lines[lineIdx].startsWith("> ")) {
                    quoteLines.push(lines[lineIdx].replace(/^>\s?/, ""));
                    lineIdx++;
                }
                elements.push(
                    <blockquote key={`bq-${i++}`} className="border-l-3 border-blue-400 pl-4 py-1 my-2 text-gray-600 italic bg-blue-50/50 rounded-r-lg">
                        {quoteLines.map((ql, j) => (
                            <span key={j}>{renderInline(ql, `bq-${i}-${j}`)}{j < quoteLines.length - 1 && <br />}</span>
                        ))}
                    </blockquote>
                );
                continue;
            }

            // ── Empty line = paragraph break ──
            if (line.trim() === "") {
                lineIdx++;
                continue;
            }

            // ── Regular paragraph ──
            // Collect consecutive non-empty, non-special lines
            const paraLines: string[] = [];
            while (
                lineIdx < lines.length &&
                lines[lineIdx].trim() !== "" &&
                !lines[lineIdx].match(/^(```|~~~)/) &&
                !lines[lineIdx].match(/^#{1,6}\s+/) &&
                !lines[lineIdx].match(/^\s*[-*+•]\s+/) &&
                !lines[lineIdx].match(/^\s*\d+[.)]\s+/) &&
                !lines[lineIdx].startsWith("> ") &&
                !lines[lineIdx].match(/^---+$/) &&
                !lines[lineIdx].match(/^\*\*\*+$/)
            ) {
                paraLines.push(lines[lineIdx]);
                lineIdx++;
            }
            if (paraLines.length > 0) {
                elements.push(
                    <p key={`p-${i++}`} className="text-[15px] leading-relaxed my-1">
                        {paraLines.map((pl, j) => (
                            <React.Fragment key={j}>
                                {renderInline(pl, `p-${i}-${j}`)}
                                {j < paraLines.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </p>
                );
            }
        }

        return elements;
    }, [text]);

    return <div className="chat-markdown">{rendered}</div>;
}
