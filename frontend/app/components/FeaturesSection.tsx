"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparks } from "iconoir-react";

export default function FeaturesSection() {
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
        <section ref={sectionRef} className="w-full bg-[#f5f5f7] py-24 md:py-32 relative font-dm">
            <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">

                {/* Header */}
                <div
                    className="flex flex-col items-center mb-16 transition-all duration-[600ms] ease-out"
                    style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)" }}
                >
                    <div className="px-5 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm text-sm text-gray-500 font-medium mb-6">
                        FEATURES
                    </div>
                    <h2 className="font-sora text-3xl md:text-5xl font-bold text-gray-900 text-center tracking-tight mb-4">
                        Built for developers who hate wasting time.
                    </h2>
                    <p className="text-gray-500 text-base md:text-lg">Stop skimming docs. Start getting answers.</p>
                </div>

                {/* Bento Grid layout matching the prompt constraints */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-5xl mb-12">

                    {/* Card 1: Top Left (Conversational Search) */}
                    <div
                        className="md:col-span-3 bg-white rounded-3xl p-8 flex flex-col min-h-[420px] border border-gray-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "100ms" }}
                    >
                        <div className="flex-1 bg-gray-50 rounded-2xl mb-8 overflow-hidden relative border border-gray-100 flex items-center justify-center p-6 shadow-inner">
                            {/* UI Preview: Chat Mockup */}
                            <div className="w-full max-w-[280px] flex flex-col gap-3">
                                <div className="self-end bg-blue-100/80 text-blue-800 text-[11px] font-medium px-4 py-2.5 rounded-2xl rounded-tr-[4px] shadow-sm">
                                    Search auth provider
                                </div>
                                <div className="self-start bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.05)] border border-gray-100 text-[11px] px-4 py-2.5 rounded-2xl rounded-tl-[4px] text-gray-700 flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 border border-blue-100 flex items-center justify-center shrink-0">
                                        <Sparks className="w-[8px] h-[8px] text-white" strokeWidth={3} />
                                    </div>
                                    <span className="font-semibold text-gray-800">Found in auth_utils.py</span>
                                </div>
                                <div className="self-start bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.05)] border border-gray-100 text-[11px] px-4 py-3 rounded-2xl text-gray-600 mt-1 max-w-[85%]">
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="h-1.5 w-[90%] bg-gray-100 rounded-full"></div>
                                        <div className="h-1.5 w-[70%] bg-gray-100 rounded-full"></div>
                                        <div className="h-1.5 w-[80%] bg-gray-100 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Cited Sources</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Every answer links back to the exact file and line it came from. Not just an answer — proof. Click any citation to see the source passage.</p>
                    </div>

                    {/* Card 2: Top Right (Automated Ingestion) */}
                    <div
                        className="md:col-span-2 bg-white rounded-3xl p-8 flex flex-col min-h-[420px] border border-gray-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "200ms" }}
                    >
                        <div className="flex-1 bg-gray-50 rounded-2xl mb-8 overflow-hidden relative border border-gray-100 flex flex-col pt-6 pb-4 px-6 justify-center gap-3 shadow-inner">
                            {/* UI Preview: Calendar/Processing Grid */}
                            <div className="flex justify-between w-full border-b border-gray-200/60 pb-2 mb-2">
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Mon</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Tue</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Wed</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Thu</div>
                            </div>
                            <div className="flex-1 grid grid-cols-4 gap-3">
                                <div className="flex flex-col gap-2 items-center justify-end h-full">
                                    <div className="w-full bg-blue-100/50 rounded-md border border-blue-200 flex-1 hover:bg-blue-100 transition-colors"></div>
                                    <div className="w-full bg-blue-500 rounded-[4px] h-[30%] shadow-sm"></div>
                                </div>
                                <div className="flex flex-col gap-2 items-center justify-end h-full">
                                    <div className="w-full bg-blue-500 rounded-md shadow-sm flex-1"></div>
                                </div>
                                <div className="flex flex-col gap-2 items-center justify-end h-full">
                                    <div className="w-full bg-blue-100/50 rounded-md border border-blue-200 h-[60%] hover:bg-blue-100 transition-colors"></div>
                                    <div className="w-full bg-blue-400 rounded-md h-[40%] shadow-sm"></div>
                                </div>
                                <div className="flex flex-col gap-2 items-center justify-end h-full">
                                    <div className="w-full bg-purple-100/50 rounded-md border border-purple-200 h-[20%]"></div>
                                    <div className="w-full bg-blue-500 rounded-md shadow-sm flex-1"></div>
                                </div>
                            </div>
                        </div>
                        <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Streamed Responses</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Answers appear token by token — no loading spinners, no waiting for a wall of text. It feels like talking to someone who knows the repo.</p>
                    </div>

                    {/* Card 3: Bottom Left (Local Knowledge Storage/Workflow Automation) */}
                    <div
                        className="md:col-span-3 bg-white rounded-3xl p-8 flex flex-col md:flex-row gap-8 min-h-[220px] border border-gray-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "300ms" }}
                    >
                        <div className="flex-1 bg-gray-50 rounded-2xl h-[160px] md:h-auto overflow-hidden relative border border-gray-100 p-6 flex flex-col gap-5 justify-center shadow-inner">
                            {/* UI Preview: Kanban / Timeline */}
                            <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 bg-orange-100 text-orange-600 rounded flex items-center justify-center text-[8px] border border-orange-200">#1</span>
                                        <span className="text-[10px] font-bold text-gray-600">New Ideas Campaign</span>
                                    </div>
                                    <div className="flex -space-x-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-4 h-4 rounded-full bg-gray-300 border border-white"></div>
                                        <div className="w-4 h-4 rounded-full bg-gray-400 border border-white"></div>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full w-[60%] bg-orange-400 rounded-full shadow-sm"></div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 bg-green-100 text-green-600 rounded flex items-center justify-center text-[8px] border border-green-200">#2</span>
                                        <span className="text-[10px] font-bold text-gray-600">Design Presentation</span>
                                    </div>
                                    <div className="flex -space-x-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-4 h-4 rounded-full bg-blue-300 border border-white"></div>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full w-[112%] bg-green-500 rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Multi-Repo Support</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">Load multiple repositories and switch context instantly. Each repo gets its own isolated knowledge base — no crossover, no confusion.</p>
                        </div>
                    </div>

                    {/* Card 4: Bottom Right (Customizable Workspaces - Dashed border) */}
                    <div
                        className="md:col-span-2 bg-transparent rounded-3xl p-8 flex flex-col min-h-[220px] border-[2px] border-dashed border-gray-300/80 hover:bg-white/50 hover:shadow-sm hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "400ms" }}
                    >
                        <div className="flex-1 rounded-2xl mb-6 flex flex-col p-2">
                            {/* UI Preview: Widget Switcher */}
                            <div className="flex gap-3 h-full items-center justify-center pb-4">
                                <div className="flex-1 h-[72px] bg-white border border-gray-200 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.05)] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-gray-300 cursor-pointer transition-colors">
                                    <div className="grid grid-cols-2 grid-rows-2 gap-[2px]">
                                        <div className="w-2.5 h-2.5 bg-gray-300 rounded-[2px]"></div>
                                        <div className="w-2.5 h-2.5 bg-gray-300 rounded-[2px]"></div>
                                        <div className="w-2.5 h-2.5 bg-gray-300 rounded-[2px]"></div>
                                        <div className="w-2.5 h-2.5 bg-gray-300 rounded-[2px]"></div>
                                    </div>
                                    <div className="h-1.5 w-8 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="flex-1 h-[84px] bg-white border border-blue-500 shadow-[0_8px_16px_-4px_rgba(59,130,246,0.15)] rounded-xl flex flex-col items-center justify-center gap-2 relative transform -translate-y-2 cursor-pointer transition-transform">
                                    <div className="absolute -top-1.5 right-1/2 translate-x-1/2 bg-blue-500 text-white text-[8px] font-bold px-1.5 rounded-full">ACTIVE</div>
                                    <div className="text-[10px] font-sora font-semibold text-gray-800">14:02</div>
                                    <div className="w-6 h-6 rounded-full border-[3px] border-gray-100 flex items-center justify-center relative">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Any Public Repo</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">Works on any public GitHub repository — docs, guides, wikis, READMEs. If it's on GitHub and it's public, just paste the link and go.</p>
                        </div>
                    </div>

                </div>

                <p className="text-sm font-medium text-gray-400 mt-2 hover:text-gray-500 transition-colors cursor-pointer">and it only gets better the more you use it.</p>
            </div>
        </section>
    );
}
