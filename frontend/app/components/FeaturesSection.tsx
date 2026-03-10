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
        <section id="features" ref={sectionRef} className="w-full bg-[#f5f5f7] py-16 md:py-20 relative font-dm">
            <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex flex-col items-center">

                {/* Header */}
                <div
                    className="flex flex-col items-center mb-10 transition-all duration-[600ms] ease-out"
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
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 w-full max-w-[1400px] mb-8">

                    {/* Card 1: Top Left (Conversational Search) */}
                    <div
                        className="lg:col-span-3 bg-white rounded-3xl p-8 flex flex-col min-h-[350px] border border-gray-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "100ms" }}
                    >
                        <div className="flex-1 bg-gray-50 rounded-2xl mb-8 overflow-hidden relative border border-gray-100 flex items-center justify-center p-6 shadow-inner">
                            {/* UI Preview: Cited Sources */}
                            <div className="w-full max-w-[320px] bg-[#0d1117] rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col relative font-mono text-[11px] group">
                                {/* Header */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-gray-800">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                    </div>
                                    <div className="text-gray-400 text-[10px] ml-1">auth_utils.py</div>
                                </div>
                                {/* Code */}
                                <div className="flex flex-col py-3">
                                    <div className="flex px-3 py-0.5 text-gray-500/50"><span className="w-5 text-right mr-3">40</span><span className="text-gray-400">def verify_token(token: str):</span></div>
                                    <div className="flex px-3 py-0.5 text-gray-500/50"><span className="w-5 text-right mr-3">41</span><span className="text-gray-400">    try:</span></div>
                                    {/* Highlighted Line */}
                                    <div className="flex px-3 py-1 bg-blue-500/20 border-l-2 border-blue-500 text-gray-500 relative">
                                        <span className="w-[18px] text-right mr-3 text-blue-400/80">42</span>
                                        <span className="text-blue-200">        payload = jwt.decode(token)</span>
                                    </div>
                                    <div className="flex px-3 py-0.5 text-gray-500/50"><span className="w-5 text-right mr-3">43</span><span className="text-gray-400">        return payload</span></div>
                                </div>
                                {/* Floating Citation Chip */}
                                <div className="absolute bottom-2 -right-2 bg-white border border-blue-100 shadow-lg rounded-full px-3 py-1.5 flex items-center gap-1.5 animate-bounce group-hover:scale-105 transition-transform" style={{ animationDuration: '3s' }}>
                                    <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 font-sora">auth_utils.py · L42</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Cited Sources</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Every answer links back to the exact file and line it came from. Not just an answer — proof. Click any citation to see the source passage.</p>
                    </div>

                    {/* Card 2: Top Right (Automated Ingestion) */}
                    <div
                        className="lg:col-span-2 bg-white rounded-3xl p-8 flex flex-col min-h-[350px] border border-gray-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "200ms" }}
                    >
                        <div className="flex-1 bg-gray-50 rounded-2xl mb-8 overflow-hidden relative border border-gray-100 flex flex-col p-6 items-center justify-center shadow-inner">
                            {/* UI Preview: Streamed Responses */}
                            <style dangerouslySetInnerHTML={{
                                __html: `
                            @keyframes type-text { 0% { width: 0; } 40%, 100% { width: 13.5ch; } }
                            @keyframes blink-cursor { 0%, 100% { border-color: transparent; } 50% { border-color: #3b82f6; } }
                            .animate-typing { overflow: hidden; white-space: nowrap; border-right: 2px solid #3b82f6; width: 13.5ch; animation: type-text 3s steps(15, end) infinite, blink-cursor 0.75s step-end infinite; }
                            `}} />
                            <div className="w-full max-w-[280px] flex flex-col gap-3 relative mt-2">
                                <div className="self-end bg-blue-600 text-white text-[12px] font-medium px-4 py-2.5 rounded-2xl rounded-tr-[4px] shadow-sm max-w-[85%]">
                                    Explain the auth flow
                                </div>
                                <div className="self-start flex max-w-[90%] relative">
                                    {/* AI Avatar */}
                                    <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-2 shrink-0 shadow-sm mt-0.5">
                                        <div className="flex flex-wrap w-[10px] gap-[1.5px]">
                                            <div className="w-[3.5px] h-[3.5px] rounded-full bg-blue-600"></div>
                                            <div className="w-[3.5px] h-[3.5px] rounded-full bg-gray-800"></div>
                                            <div className="w-[3.5px] h-[3.5px] rounded-full bg-gray-800"></div>
                                            <div className="w-[3.5px] h-[3.5px] rounded-full bg-gray-800"></div>
                                        </div>
                                    </div>
                                    {/* Typing Bubble */}
                                    <div className="bg-white border border-gray-100 text-[13px] px-4 py-3 rounded-2xl rounded-tl-[4px] text-gray-700 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] h-[44px] flex items-center">
                                        <span className="font-dm font-medium animate-typing">
                                            The auth flow
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Streamed Responses</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Answers appear token by token — no loading spinners, no waiting for a wall of text. It feels like talking to someone who knows the repo.</p>
                    </div>

                    {/* Card 3: Bottom Left (Local Knowledge Storage/Workflow Automation) */}
                    <div
                        className="lg:col-span-3 bg-white rounded-3xl p-8 flex flex-col md:flex-row gap-8 min-h-[200px] border border-gray-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "300ms" }}
                    >
                        <div className="flex-1 bg-gray-50 rounded-2xl h-[120px] md:h-auto overflow-hidden relative border border-gray-100 p-6 flex flex-col justify-center items-center shadow-inner group">
                            {/* UI Preview: Multi-Repo Support */}
                            <div className="flex flex-col w-[200px] relative mt-4">
                                {/* Repo Card 1 */}
                                <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-md shadow-blue-500/10 relative z-20 group-hover:translate-x-2 transition-transform duration-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[12px] font-bold text-gray-800 font-mono">Company/frontend</span>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Active</span>
                                </div>

                                {/* Repo Card 2 */}
                                <div className="bg-white/80 border border-gray-200 rounded-xl p-3 shadow-sm relative z-10 translate-x-3 -mt-4 group-hover:-mt-2 group-hover:translate-x-4 transition-all duration-300 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[12px] font-bold text-gray-500 font-mono">Company/backend</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 border border-gray-200 text-gray-400 px-1.5 py-0.5 rounded">Indexed</span>
                                </div>

                                {/* Repo Card 3 */}
                                <div className="bg-white/50 border border-gray-200/50 rounded-xl p-3 shadow-sm relative z-0 translate-x-6 -mt-4 group-hover:-mt-2 group-hover:translate-x-6 transition-all duration-300 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[12px] font-bold text-gray-400 font-mono">Company/docs</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 text-gray-300 px-1.5 py-0.5 rounded">Indexed</span>
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
                        className="lg:col-span-2 bg-transparent rounded-3xl p-8 flex flex-col min-h-[200px] border-[2px] border-dashed border-gray-300/80 hover:bg-white/50 hover:shadow-sm hover:-translate-y-1 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "400ms" }}
                    >
                        <div className="flex-1 rounded-2xl mb-6 flex flex-col p-2 justify-center items-center">
                            {/* UI Preview: Any Public Repo */}
                            <style dangerouslySetInnerHTML={{
                                __html: `
                            @keyframes progress-load { 0% { width: 0; opacity: 1; } 50% { width: 100%; opacity: 1; } 55% { opacity: 0; } 100% { width: 0; opacity: 0; } }
                            @keyframes pulse-active { 0%, 100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
                            .progress-bar { animation: progress-load 3s ease-in-out infinite; }
                            .active-pulse { animation: pulse-active 2s infinite; }
                            `}} />
                            <div className="flex flex-col gap-5 w-full max-w-[240px]">
                                {/* GitHub URL Input Bar */}
                                <div className="bg-white border border-gray-200 shadow-sm rounded-full p-1.5 flex items-center relative overflow-hidden h-11 w-full">
                                    <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 ml-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                                    </div>
                                    <span className="text-[12px] text-gray-800 font-mono ml-2.5 outline-none bg-transparent">facebook/react</span>

                                    {/* Animated Progress Bar underneath */}
                                    <div className="absolute bottom-0 left-0 h-[2px] bg-blue-500 progress-bar"></div>
                                </div>

                                {/* "Active" Badge */}
                                <div className="self-center flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shadow-sm mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 active-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Connected</span>
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
