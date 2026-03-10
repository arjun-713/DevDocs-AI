"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Page, WarningTriangle, Database, Server, Plus } from "iconoir-react";
import { Logo, LogoIcon } from "../components/Logo";
import ChatMarkdown from "../components/ChatMarkdown";
import MessageActions from "../components/MessageActions";

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
    const [cachedRepos, setCachedRepos] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper functions
    const formatRepoUrl = (url: string) => {
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            if (cleanUrl.startsWith("github.com/")) {
                cleanUrl = "https://" + cleanUrl;
            } else {
                cleanUrl = "https://github.com/" + cleanUrl;
            }
        }
        return cleanUrl;
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isStreaming]);

    // Load cached repos from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("devdocs_cached_repos");
        if (stored) {
            try {
                setCachedRepos(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    // Save active repo to cache when ready
    useEffect(() => {
        if (status === "ready" && repoUrl) {
            setCachedRepos(prev => {
                if (!prev.includes(repoUrl)) {
                    const updated = [repoUrl, ...prev];
                    localStorage.setItem("devdocs_cached_repos", JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
        }
    }, [status, repoUrl]);

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

    const fetchAIResponse = async (query: string, model: string): Promise<{ content: string; sources: { source: string; url: string }[] }> => {
        const res = await fetch("/api/v1/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo_url: repoUrl, query, model }),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Error generating response");
        }

        const fullText = await res.text();
        let answerText = fullText;
        let parsedSources: { source: string; url: string }[] = [];

        if (fullText.startsWith("METADATA:")) {
            const splitIndex = fullText.indexOf("\n\n");
            if (splitIndex !== -1) {
                const metaString = fullText.substring("METADATA:".length, splitIndex);
                try { parsedSources = JSON.parse(metaString); } catch (e) { console.error("Failed to parse metadata", e); }
                answerText = fullText.substring(splitIndex + 2);
            } else {
                answerText = "";
            }
        }
        return { content: answerText.trim(), sources: parsedSources };
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || status !== "ready" || isStreaming) return;

        const query = inputValue.trim();
        setInputValue("");

        // Handle slash commands locally
        if (query.startsWith("/")) {
            const [command, ...args] = query.split(" ");
            const argString = args.join(" ").trim();

            if (command === "/new" || command === "/repo") {
                if (argString) {
                    router.push(`/chat?repo=${encodeURIComponent(formatRepoUrl(argString))}`);
                } else {
                    setMessages((prev) => [...prev, { role: "ai", content: "Please provide a GitHub URL after the command. Example: `/new https://github.com/facebook/react`" }]);
                }
                return;
            } else if (command === "/help") {
                setMessages((prev) => [...prev, { role: "ai", content: "**Available Commands:**\n\n- `/new <github-url>`: Index and chat with a new repository.\n- `/clear`: Clear the current chat history.\n- `/help`: Show this help message." }]);
                return;
            } else if (command === "/clear") {
                const repoName = repoUrl.replace(/^https?:\/\/github\.com\//, "");
                setMessages([{ role: "ai", content: `Repository **${repoName}** is fully indexed and ready. Ask me anything about it!` }]);
                return;
            } else {
                setMessages((prev) => [...prev, { role: "ai", content: `Unknown command: \`${command}\`. Type \`/help\` to see available commands.` }]);
                return;
            }
        }

        setMessages((prev) => [...prev, { role: "user", content: query }]);
        setIsStreaming(true);

        try {
            const result = await fetchAIResponse(query, selectedModel);
            setMessages((prev) => [...prev, { role: "ai", content: result.content, sources: result.sources }]);
        } catch (error: any) {
            setMessages((prev) => [...prev, { role: "ai", content: `Error: ${error.message}` }]);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleRegenerate = async (msgIdx: number, overrideModel?: string) => {
        // Find the user message that preceded this AI message
        let userQuery = "";
        for (let i = msgIdx - 1; i >= 0; i--) {
            if (messages[i].role === "user") {
                userQuery = messages[i].content;
                break;
            }
        }
        if (!userQuery || isStreaming) return;

        setIsStreaming(true);
        // Replace the AI message at msgIdx with a placeholder
        setMessages((prev) => prev.map((m, i) => i === msgIdx ? { ...m, content: "Regenerating...", sources: [] } : m));

        try {
            const result = await fetchAIResponse(userQuery, overrideModel || selectedModel);
            setMessages((prev) => prev.map((m, i) => i === msgIdx ? { role: "ai", content: result.content, sources: result.sources } : m));
        } catch (error: any) {
            setMessages((prev) => prev.map((m, i) => i === msgIdx ? { role: "ai", content: `Error: ${error.message}` } : m));
        } finally {
            setIsStreaming(false);
        }
    };

    // Show typing dots while waiting for the full response
    const showTypingIndicator = isStreaming;

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
            <div className="hidden md:flex w-[260px] bg-white border-r border-gray-200 flex-col pt-4 shrink-0 overflow-y-auto">
                <div className="px-5 pb-4 border-b border-gray-100 mb-4 flex items-center justify-between cursor-pointer shrink-0" onClick={() => router.push("/")}>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5"><LogoIcon /></div>
                        <span className="font-sora font-bold text-sm text-[#0f0f0f] tracking-tight" style={{ fontFamily: '"Noto Sans", sans-serif' }}>DevDocs AI</span>
                    </div>
                </div>

                <div className="px-5 flex flex-col gap-1 pb-4">
                    <button onClick={() => { setInputValue("/new "); document.getElementById('chat-input')?.focus(); }} className="mb-4 mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer">
                        <Plus className="w-4 h-4" strokeWidth={3} /> New Repository
                    </button>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Saved Repositories</div>

                    {/* Active Repo if not yet cached (e.g. while ingesting) */}
                    {!cachedRepos.includes(repoUrl) && repoUrl && (
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-blue-50 border border-blue-100 shadow-sm relative overflow-hidden mb-2">
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
                    )}

                    {/* Cached Repos */}
                    {cachedRepos.map((repo) => (
                        <div
                            key={repo}
                            onClick={() => { if (repo !== repoUrl) router.push(`/chat?repo=${encodeURIComponent(repo)}`); }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${repo === repoUrl ? 'bg-blue-50 border border-blue-100 shadow-sm relative overflow-hidden' : 'hover:bg-gray-50 border border-transparent'}`}
                        >
                            {repo === repoUrl && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                            <Database className={`w-4 h-4 shrink-0 ${repo === repoUrl ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={2.5} />
                            <div className="flex flex-col min-w-0">
                                <span className={`text-xs font-semibold truncate ${repo === repoUrl ? 'text-gray-800' : 'text-gray-600'}`} title={repo}>
                                    {repo.split("/").slice(-2).join("/")}
                                </span>
                                {repo === repoUrl ? (
                                    <span className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Active
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                        Cached local
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto p-5 border-t border-gray-100 bg-gray-50/50">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">AI Model</div>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-shadow appearance-none cursor-pointer"
                        style={{ backgroundSize: '1rem', backgroundPosition: 'calc(100% - 10px) center', backgroundRepeat: 'no-repeat', backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%236b7280\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')" }}
                    >
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-3.0-flash">Gemini 3.0 Flash</option>
                        <option value="gemini-3.0-pro">Gemini 3.0 Pro</option>
                        <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                        <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                    </select>
                </div>
            </div>

            {/* ── Main Chat Area ── */}
            <div className="flex-1 flex flex-col relative bg-[#fcfcfc] w-full min-w-0">
                {/* Mobile Header */}
                <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
                    <div className="flex items-center cursor-pointer" onClick={() => router.push("/")}>
                        <Logo forceDarkText={true} className="scale-[0.8] origin-left -ml-1" />
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
                        {status === "ready" && messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"} group/msg`}
                            >
                                {/* AI Avatar */}
                                {msg.role === "ai" && (
                                    <div className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center mr-3 shrink-0 mt-1">
                                        <div className="w-5 h-5"><LogoIcon /></div>
                                    </div>
                                )}

                                <div className={`flex flex-col min-w-0 ${msg.role === "user" ? "items-end max-w-[85%]" : "max-w-[90%] md:max-w-[85%]"}`}>
                                    <div
                                        className={`rounded-[1.5rem] text-[15px] leading-relaxed break-words ${msg.role === "user"
                                            ? "px-5 py-4 bg-blue-600 text-white rounded-br-md shadow-md shadow-blue-600/20"
                                            : "px-5 py-4 bg-white border border-gray-200/80 text-gray-800 rounded-bl-md shadow-sm"
                                            }`}
                                    >
                                        {msg.role === "user" ? (
                                            <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                        ) : (
                                            <ChatMarkdown text={msg.content} />
                                        )}
                                    </div>

                                    {/* Source Citations */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 ml-1">
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

                                    {/* Action buttons for AI messages */}
                                    {msg.role === "ai" && msg.content !== "Regenerating..." && (
                                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
                                            <MessageActions
                                                content={msg.content}
                                                onRegenerate={(model) => handleRegenerate(idx, model)}
                                                onLike={() => { }}
                                                onDislike={() => { }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* ── Typing / Streaming Indicator ── */}
                        {showTypingIndicator && status === "ready" && (
                            <div className="flex w-full justify-start">
                                <div className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center mr-3 shrink-0 mt-1">
                                    <div className="w-5 h-5"><LogoIcon /></div>
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
                            {/* Command Autocomplete Hint */}
                            {inputValue.startsWith("/") && (
                                <div className="absolute bottom-[calc(100%+12px)] left-0 w-full bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-1">Commands</div>
                                    <div className="flex flex-col gap-1">
                                        <button type="button" onClick={() => { setInputValue("/new "); document.getElementById('chat-input')?.focus(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-left transition-colors">
                                            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-mono text-xs font-bold shrink-0">/</div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800">/new &lt;url&gt;</span>
                                                <span className="text-[10px] text-gray-500">Chat with a new repository</span>
                                            </div>
                                        </button>
                                        <button type="button" onClick={() => { setInputValue("/clear "); document.getElementById('chat-input')?.focus(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-left transition-colors">
                                            <div className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-mono text-xs font-bold shrink-0">/</div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800">/clear</span>
                                                <span className="text-[10px] text-gray-500">Clear the current chat history</span>
                                            </div>
                                        </button>
                                        <button type="button" onClick={() => { setInputValue("/help "); document.getElementById('chat-input')?.focus(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-left transition-colors">
                                            <div className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-mono text-xs font-bold shrink-0">/</div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800">/help</span>
                                                <span className="text-[10px] text-gray-500">Show available commands</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form
                                onSubmit={handleSend}
                                className="relative flex items-center w-full bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] border border-gray-200/80 rounded-[2rem] overflow-hidden focus-within:ring-2 focus-within:ring-blue-200 transition-all p-1.5"
                            >
                                <input
                                    id="chat-input"
                                    type="text"
                                    className="flex-1 bg-transparent px-5 py-3.5 outline-none text-[15px] font-medium text-gray-800 placeholder:text-gray-400 min-w-0"
                                    placeholder="Ask a question or type '/' for commands..."
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
