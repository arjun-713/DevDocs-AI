"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Database, Flash, Message, Sparks, Page, Folder, Settings } from "iconoir-react";

export default function HowItWorksSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section id="how-it-works" ref={sectionRef} className="w-full bg-white py-16 md:py-20 relative overflow-hidden font-dm">
            <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex flex-col items-center">

                {/* Header */}
                <div
                    className="flex flex-col items-center mb-10 transition-all duration-500"
                    style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)" }}
                >
                    <div className="px-5 py-1.5 rounded-full border border-gray-200 text-sm text-gray-500 font-medium mb-6">
                        HOW IT WORKS
                    </div>
                    <h2 className="font-sora text-3xl md:text-5xl font-bold text-gray-900 text-center tracking-tight">
                        Three steps. Zero setup.
                    </h2>
                </div>

                {/* 3 Steps */}
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-center max-w-[1400px] mx-auto mb-16 w-full">
                    <div className="hidden md:block absolute top-[28px] left-[16%] right-[16%] h-[2px] border-t-2 border-dashed border-gray-200 z-0"></div>

                    <div
                        className="flex flex-col items-center relative z-10 transition-all duration-500 delay-100"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)" }}
                    >
                        <div className="w-14 h-14 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center text-blue-600 mb-6 relative">
                            <Search className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <h3 className="font-sora font-bold text-gray-900 text-lg mb-2">Paste a repo URL</h3>
                        <p className="text-gray-500 text-sm leading-relaxed px-4">Drop in any public GitHub link. We find every documentation file automatically — READMEs, guides, API docs, all of it.</p>
                    </div>

                    <div
                        className="flex flex-col items-center relative z-10 transition-all duration-500 delay-200"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)" }}
                    >
                        <div className="w-14 h-14 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center text-blue-600 mb-6 relative">
                            <Database className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <h3 className="font-sora font-bold text-gray-900 text-lg mb-2">We index the docs</h3>
                        <p className="text-gray-500 text-sm leading-relaxed px-4">Our pipeline chunks every file semantically and embeds it into a vector database. The whole repo is searchable in seconds.</p>
                    </div>

                    <div
                        className="flex flex-col items-center relative z-10 transition-all duration-500 delay-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)" }}
                    >
                        <div className="w-14 h-14 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center text-blue-600 mb-6 relative">
                            <Flash className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <h3 className="font-sora font-bold text-gray-900 text-lg mb-2">Ask anything</h3>
                        <p className="text-gray-500 text-sm leading-relaxed px-4">Ask in plain English. Get answers grounded in the actual source material — with the exact file and passage it came from.</p>
                    </div>
                </div>

                {/* Big Chat UI Container */}
                <div
                    className="relative w-full max-w-[1200px] h-[400px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)] transition-all duration-700 ease-out flex mt-4"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(40px)",
                        transitionDelay: "400ms"
                    }}
                >
                    {/* Mock UI Frame */}
                    <div className="absolute inset-[10px] bg-white rounded-2xl overflow-hidden flex shadow-inner">

                        {/* Left Sidebar */}
                        <div className="hidden md:flex w-[240px] bg-gray-50/80 border-r border-gray-100 flex-col pt-4">
                            <div className="px-4 pb-2 border-b border-gray-100 mb-3">
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Conversations</div>
                            </div>
                            <div className="px-2 space-y-1">
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50/60 border border-blue-100/50 cursor-pointer">
                                    <Message className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-semibold text-gray-800 truncate">Configure path aliases</span>
                                    <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-100 cursor-pointer text-gray-500 transition-colors">
                                    <Message className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-medium truncate">Database schema setup</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-100 cursor-pointer text-gray-500 transition-colors">
                                    <Message className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-medium truncate">How to run Docker</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Chat Area */}
                        <div className="flex-1 bg-white flex flex-col relative">
                            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-800">Configure path aliases</span>
                                    <span className="text-[10px] text-gray-400">vitejs/vite</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">⋯</div>
                                </div>
                            </div>

                            <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden relative">
                                {/* User Message */}
                                <div className="self-end bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-[4px] text-sm shadow-sm max-w-[80%]">
                                    How do I configure path aliases in Vite?
                                </div>

                                {/* AI Message */}
                                <div className="self-start flex max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 border border-blue-100 flex items-center justify-center mr-3 shrink-0 shadow-inner">
                                        <Sparks className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="bg-white border border-gray-200 text-gray-800 px-5 py-4 rounded-2xl rounded-tl-[4px] text-[13px] leading-relaxed shadow-sm">
                                        <p className="mb-3">You can configure path aliases using the <code className="bg-gray-100 px-1 inline-block pb-[1px] rounded text-gray-800 font-mono text-[11px]">resolve.alias</code> option in <code className="bg-gray-100 px-1 inline-block pb-[1px] rounded text-gray-800 font-mono text-[11px]">vite.config.ts</code>. For example:</p>

                                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 font-mono text-[11px] text-gray-600 mb-3 overflow-x-auto whitespace-pre">
                                            <span className="text-blue-500">resolve</span>: {"{\n"}
                                            <span className="text-blue-500">alias</span>: {"{\n"}
                                            <span className="text-green-600">'@'</span>: path.resolve(__dirname, <span className="text-green-600">'./src'</span>)
                                            {"}\n"}
                                            {"}"}
                                        </div>

                                        <p className="mb-3 text-gray-600">This maps @ to your /src directory across all imports.</p>

                                        <div className="flex flex-col gap-1.5 mt-2 border-t border-gray-100 pt-3">
                                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 cursor-pointer">
                                                <Page className="w-3.5 h-3.5 text-blue-500" /> docs/config/shared-options.md · line 112
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 cursor-pointer">
                                                <Page className="w-3.5 h-3.5 text-blue-500" /> docs/guide/features.md · line 67
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Typing Indicator */}
                                <div className="self-start flex max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 border border-blue-100 flex items-center justify-center mr-3 shrink-0 shadow-inner">
                                        <Sparks className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="bg-white border border-gray-200 text-gray-800 px-4 py-4 rounded-2xl rounded-tl-[4px] shadow-sm flex items-center gap-[5px] w-16 justify-center">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                    </div>
                                </div>

                                {/* Overlay gradient at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Widget: Top Right Summary */}
                    <div
                        className="hidden md:block absolute -top-8 -right-8 bg-white p-5 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-gray-100 w-64 transform transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-20"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "scale(1) rotate(2deg)" : "scale(0.85) rotate(0deg)",
                            transitionDelay: "800ms"
                        }}
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                            <span className="flex items-center font-sora tracking-wide font-bold text-[11px] uppercase text-gray-800"><Sparks className="w-3.5 h-3.5 text-gray-800 mr-1" strokeWidth={2} /> AI Summary</span>
                            <div className="w-3.5 h-3.5 text-blue-500">
                                <Sparks className="w-full h-full" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="h-2.5 w-[90%] bg-gray-100 rounded-full"></div>
                            <div className="h-2.5 w-[75%] bg-gray-100 rounded-full"></div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-gray-400">Analyzed 1.2k files</span>
                            <span className="text-[9px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded shadow-sm">+99% accuracy</span>
                        </div>
                    </div>

                    {/* Floating Widget: Bottom Left Integrations */}
                    <div
                        className="hidden md:flex flex-col absolute -bottom-6 -left-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 transform transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-20"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "scale(1) rotate(-1deg)" : "scale(0.85) rotate(0deg)",
                            transitionDelay: "1000ms"
                        }}
                    >
                        <span className="block font-sora font-semibold text-[10px] uppercase tracking-wider text-center text-gray-500 mb-3">Indexed Sources</span>
                        <div className="flex gap-2">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100/80 hover:-translate-y-1 transition-transform cursor-pointer"><Folder className="w-5 h-5 text-gray-600" /></div>
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100/80 hover:-translate-y-1 transition-transform cursor-pointer"><Settings className="w-5 h-5 text-gray-600" /></div>
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100/80 hover:-translate-y-1 transition-transform cursor-pointer"><Message className="w-5 h-5 text-gray-600" /></div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}
