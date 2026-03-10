"use client";

import React, { useState, useRef, useEffect } from "react";

interface MessageActionsProps {
    content: string;
    onRegenerate: (model?: string) => void;
    onLike: () => void;
    onDislike: () => void;
}

const MODELS = [
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.0-pro", label: "Gemini 2.0 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-3.0-flash", label: "Gemini 3.0 Flash" },
    { value: "gemini-3.0-pro", label: "Gemini 3.0 Pro" },
    { value: "gemini-3.1-flash", label: "Gemini 3.1 Flash" },
    { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
];

export default function MessageActions({ content, onRegenerate, onLike, onDislike }: MessageActionsProps) {
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState<null | "like" | "dislike">(null);
    const [showRegenMenu, setShowRegenMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowRegenMenu(false);
            }
        }
        if (showRegenMenu) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showRegenMenu]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLike = () => {
        setLiked(liked === "like" ? null : "like");
        onLike();
    };

    const handleDislike = () => {
        setLiked(liked === "dislike" ? null : "dislike");
        onDislike();
    };

    return (
        <div className="flex items-center gap-0.5 mt-1.5 ml-0.5">
            {/* Copy */}
            <button
                onClick={handleCopy}
                title="Copy response"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
                {copied ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                )}
            </button>

            {/* Like */}
            <button
                onClick={handleLike}
                title="Good response"
                className={`p-1.5 rounded-lg transition-all ${liked === "like" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
            >
                <svg className="w-4 h-4" fill={liked === "like" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                </svg>
            </button>

            {/* Dislike */}
            <button
                onClick={handleDislike}
                title="Bad response"
                className={`p-1.5 rounded-lg transition-all ${liked === "dislike" ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
            >
                <svg className="w-4 h-4" fill={liked === "dislike" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                </svg>
            </button>

            {/* Regenerate with dropdown */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => onRegenerate()}
                    title="Regenerate response"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
                <button
                    onClick={() => setShowRegenMenu(!showRegenMenu)}
                    title="Regenerate with different model"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all -ml-0.5"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {/* Model picker dropdown */}
                {showRegenMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-52 bg-white border border-gray-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2.5 py-1.5">Regenerate with</div>
                        {MODELS.map((m) => (
                            <button
                                key={m.value}
                                onClick={() => { onRegenerate(m.value); setShowRegenMenu(false); }}
                                className="w-full text-left px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
