"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Page, WarningTriangle, Database, Server } from "iconoir-react";

/* ── Simple inline markdown renderer (bold, code, italic) ── */
function RenderMarkdown({ text }: { text: string }) {
    const parts = useMemo(() => {
        // Split by **bold**, `code`, and *italic* patterns
        const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\*(.+?)\*)/g;
        const result: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Push text before this match
            if (match.index > lastIndex) {
                result.push(text.slice(lastIndex, match.index));
            }
            if (match[2]) {
                // **bold**
                result.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
            } else if (match[4]) {
                // `code`
                result.push(<code key={match.index} className="bg-gray-100 text-blue-700 px-1.5 py-0.5 rounded text-[13px] font-mono">{match[4]}</code>);
            } else if (match[6]) {
                // *italic*
                result.push(<em key={match.index}>{match[6]}</em>);
            }
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            result.push(text.slice(lastIndex));
        }
        return result;
    }, [text]);

    return <>{parts}</>;
}

export default function ChatPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const repoUrl = searchParams.get("repo") || "";

    const [status, setStatus] = useState<"initializing" | "ingesting" | "ready" | "error">("initializing");
    const [errorMessage, setErrorMessage] = useState("");
    const [progress, setProgress] = useState(0);
    const [collectionName, setCollectionName] = useState<string | null>(null);

    const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; sources?: { source: string; url: string }[] }[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isStreaming]);

    useEffect(() => {
        if (!repoUrl) {
            router.push("/");
            return;
        }

        const initIngestion = async () => {
            try {
                const res = await fetch("/api/v1/ingest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repo_url: repoUrl }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || "Failed to start ingestion");
                }

                const data = await res.json();
                setCollectionName(data.collection_name);

                if (data.status === "completed") {
                    setStatus("ready");
                    setProgress(100);
                    const repoName = repoUrl.replace(/^https?:\/\/github\.com\//, "");
                    setMessages([{ role: "ai", content: `Repository **${repoName}** is fully indexed and ready. Ask me anything about it!` }]);
                    return;
                }

                setStatus("ingesting");
                pollStatus(data.collection_name);
            } catch (err: any) {
                setStatus("error");
                setErrorMessage(err.message);
            }
        };

        initIngestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoUrl, router]);

    const pollStatus = async (colName: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/v1/ingest/status/${colName}`);
                if (!res.ok) throw new Error("Status check failed");

                const data = await res.json();

                if (data.status === "completed") {
                    clearInterval(interval);
                    setStatus("ready");
                    setProgress(100);
                    const repoName = repoUrl.replace(/^https?:\/\/github\.com\//, "");
                    setMessages([{ role: "ai", content: `Repository **${repoName}** is fully indexed and ready. Ask me anything about it!` }]);
                } else if (data.status === "failed") {
                    clearInterval(interval);
                    setStatus("error");
                    setErrorMessage(data.error || "Ingestion failed processing files.");
                } else if (data.progress !== undefined) {
                    setProgress(data.progress);
                }
            } catch (err) {
                clearInterval(interval);
                setStatus("error");
                setErrorMessage("Lost connection to processing server.");
            }
        }, 2000);
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || status !== "ready" || isStreaming) return;

        const query = inputValue.trim();
        setInputValue("");
        setMessages((prev) => [...prev, { role: "user", content: query }]);
        setIsStreaming(true);

        try {
            const res = await fetch("/api/v1/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repo_url: repoUrl, query }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Error generating response");
            }

            // Only add the AI bubble once we're ready to stream content into it
            setMessages((prev) => [...prev, { role: "ai", content: "", sources: [] }]);

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let firstChunk = true;

            while (reader && !done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);

                if (firstChunk && chunkValue.startsWith("METADATA:")) {
                    const parts = chunkValue.split("\n\n");
                    const metaString = parts[0].substring("METADATA:".length);
                    try {
                        const sources = JSON.parse(metaString);
                        setMessages((prev) => {
                            const newMsgs = [...prev];
                            newMsgs[newMsgs.length - 1].sources = sources;
                            return newMsgs;
                        });
                    } catch (e) {
                        console.error("Failed to parse metadata", e);
                    }
                    firstChunk = false;

                    if (parts.length > 1) {
                        const textChunk = parts.slice(1).join("\n\n");
                        if (textChunk) {
                            setMessages((prev) => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1].content += textChunk;
                                return newMsgs;
                            });
                        }
                    }
                } else {
                    firstChunk = false;
                    setMessages((prev) => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1].content += chunkValue;
                        return newMsgs;
                    });
                }
            }
        } catch (error: any) {
            setMessages((prev) => [...prev, { role: "ai", content: `Error: ${error.message}` }]);
        } finally {
            setIsStreaming(false);
        }
    };

    // Determine if the last message is the currently-streaming AI message with no content yet
    const showTypingIndicator = isStreaming && (messages.length === 0 || messages[messages.length - 1].content === "");

    return (
        <div className="flex h-screen bg-[#f5f5f7] font-dm w-full overflow-hidden">

            {/* ── Fonts ── */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        .font-sora { font-family: 'Sora', sans-serif; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
      `}} />

            {/* ── Left Sidebar ── */}
            <div className="hidden md:flex w-[260px] bg-white border-r border-gray-200 flex-col pt-4 shrink-0">
                <div className="px-5 pb-4 border-b border-gray-100 mb-4 flex items-center justify-between cursor-pointer" onClick={() => router.push("/")}>
                    <div className="flex items-center gap-2">
                        <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-4 h-4 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                        </div>
                        <span className="font-sora font-bold text-sm text-[#0f0f0f]">DevDocs AI</span>
                    </div>
                </div>

                <div className="px-5 flex flex-col gap-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Active Context</div>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-blue-50 border border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <Database className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.5} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-800 truncate" title={repoUrl}>
                                {repoUrl.split("/").slice(-2).join("/") || "Repository"}
                            </span>
                            <span className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                {status === "ready" ? (
                                    <><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Indexed</>
                                ) : status === "ingesting" ? (
                                    <><span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block animate-pulse"></span> Indexing...</>
                                ) : (
                                    <><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block"></span> Pending</>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Chat Area ── */}
            <div className="flex-1 flex flex-col relative bg-[#fcfcfc] w-full min-w-0">
                {/* Mobile Header */}
                <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
                        <span className="font-sora font-bold text-[#0f0f0f]">DevDocs AI</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 truncate max-w-[150px] bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        {repoUrl.split("/").slice(-2).join("/")}
                    </span>
                </div>

                {/* Chat Scroll Area */}
                <div className="flex-1 overflow-y-auto w-full relative">
                    <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-8 pb-40 flex flex-col gap-5">

                        {/* ── Loading State ── */}
                        {(status === "initializing" || status === "ingesting") && (
                            <div className="w-full h-[60vh] flex flex-col items-center justify-center">
                                <div className="w-20 h-20 mb-6 relative">
                                    <div className="absolute inset-0 bg-blue-100 rounded-2xl rotate-3"></div>
                                    <div className="absolute inset-0 bg-blue-500 rounded-2xl -rotate-3 border-4 border-white shadow-lg flex items-center justify-center">
                                        <Server className="w-8 h-8 text-white animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="font-sora text-2xl font-bold text-gray-800 mb-2">Ingesting Repository</h2>
                                <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
                                    We are cloning, chunking, and indexing the codebase documentation. This usually takes 10–30 seconds.
                                </p>
                                <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                                    <div className="h-full bg-blue-500 transition-all duration-500 rounded-full" style={{ width: `${Math.max(5, progress)}%` }}></div>
                                </div>
                                <span className="text-xs font-medium text-gray-400 mt-3">{progress}% complete</span>
                            </div>
                        )}

                        {/* ── Error State ── */}
                        {status === "error" && (
                            <div className="w-full h-[60vh] flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-200">
                                    <WarningTriangle className="w-8 h-8" />
                                </div>
                                <h2 className="font-sora text-xl font-bold text-red-600 mb-2">Ingestion Failed</h2>
                                <p className="text-gray-600 text-sm mb-6 text-center max-w-md bg-white p-4 rounded-xl border border-gray-200">
                                    {errorMessage}
                                </p>
                                <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full shadow-sm hover:bg-gray-800 transition-colors">
                                    Go Back
                                </button>
                            </div>
                        )}

                        {/* ── Chat Messages ── */}
                        {status === "ready" && messages.map((msg, idx) => {
                            // Don't render the empty streaming placeholder as a visible bubble
                            const isEmptyStreamingBubble = isStreaming && idx === messages.length - 1 && msg.role === "ai" && msg.content === "";
                            if (isEmptyStreamingBubble) return null;

                            return (
                                <div
                                    key={idx}
                                    className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {/* AI Avatar */}
                                    {msg.role === "ai" && (
                                        <div className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center mr-3 shrink-0 mt-1">
                                            <div className="flex flex-wrap w-[14px] gap-[2px]">
                                                <div className="w-[6px] h-[6px] rounded-full bg-blue-600"></div>
                                                <div className="w-[6px] h-[6px] rounded-full bg-gray-800"></div>
                                                <div className="w-[6px] h-[6px] rounded-full bg-gray-800"></div>
                                                <div className="w-[6px] h-[6px] rounded-full bg-gray-800"></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`flex flex-col gap-2 min-w-0 ${msg.role === "user" ? "items-end max-w-[85%]" : "max-w-[90%] md:max-w-[85%]"}`}>
                                        <div
                                            className={`px-5 py-4 rounded-[1.5rem] text-[15px] leading-relaxed break-words ${msg.role === "user"
                                                ? "bg-blue-600 text-white rounded-br-md shadow-md shadow-blue-600/20"
                                                : "bg-white border border-gray-200/80 text-gray-800 rounded-bl-md shadow-sm"
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap font-medium">
                                                <RenderMarkdown text={msg.content} />
                                            </div>
                                        </div>

                                        {/* Source Citations */}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1 ml-1">
                                                {msg.sources.map((src, i) => (
                                                    <a
                                                        key={i}
                                                        href={src.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="group flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-blue-300 hover:shadow-sm transition-all text-[11px] font-medium text-gray-500 hover:text-blue-600 max-w-full overflow-hidden"
                                                    >
                                                        <Page className="w-3 h-3 shrink-0 text-blue-500" strokeWidth={2.5} />
                                                        <span className="truncate">{src.source.split("/").pop()}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* ── Typing / Streaming Indicator ── */}
                        {showTypingIndicator && status === "ready" && (
                            <div className="flex w-full justify-start">
                                <div className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center mr-3 shrink-0 mt-1">
                                    <div className="flex flex-wrap w-[14px] gap-[2px]">
                                        <div className="w-[6px] h-[6px] rounded-full bg-blue-600"></div>
                                        <div className="w-[6px] h-[6px] rounded-full bg-gray-800"></div>
                                        <div className="w-[6px] h-[6px] rounded-full bg-gray-800"></div>
                                        <div className="w-[6px] h-[6px] rounded-full bg-gray-800"></div>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200/80 rounded-[1.5rem] rounded-bl-md shadow-sm px-6 py-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4 shrink-0" />
                    </div>
                </div>

                {/* ── Input Bar (floating) ── */}
                {status === "ready" && (
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc]/95 to-transparent pt-10 pb-5 px-4 md:px-0 pointer-events-none z-10">
                        <div className="max-w-3xl mx-auto w-full relative pointer-events-auto">
                            <form
                                onSubmit={handleSend}
                                className="relative flex items-center w-full bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] border border-gray-200/80 rounded-[2rem] overflow-hidden focus-within:ring-2 focus-within:ring-blue-200 transition-all p-1.5"
                            >
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent px-5 py-3.5 outline-none text-[15px] font-medium text-gray-800 placeholder:text-gray-400 min-w-0"
                                    placeholder="Ask a question about this repository..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={isStreaming}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isStreaming}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-[1.5rem] px-5 py-3 ml-1 flex items-center gap-1.5 transition-colors font-medium text-sm shadow-sm shrink-0"
                                >
                                    <span className="hidden sm:inline">Ask</span> <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                            <div className="text-center mt-2.5">
                                <p className="text-[10px] text-gray-400 font-medium tracking-wide">AI can make mistakes. Verify cited sources.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
