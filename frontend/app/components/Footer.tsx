"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Server, CheckCircle, Database } from "iconoir-react";
import { Logo } from "./Logo";

export default function Footer() {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <footer
            ref={ref}
            className={`w-full bg-[#f0f0f0] relative overflow-hidden px-8 md:px-16 py-10 lg:py-20 transition-all duration-700 ease-out font-dm min-h-[100svh] flex flex-col ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{
                backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
                backgroundSize: "24px 24px"
            }}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes custom-float {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-6px) rotate(var(--r, 0deg)); }
        }
      `}} />

            <div className="max-w-[1800px] mx-auto w-full relative flex-1 flex flex-col justify-between">
                {/* Main Content Row */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0 relative z-10 w-full">
                    {/* Left Side */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <Logo forceDarkText={true} />
                        </div>
                        <h2 className="font-sora text-3xl md:text-4xl font-bold text-gray-900 leading-[1.15] max-w-[420px]">
                            Chat with any open-source<br />repository.
                        </h2>
                    </div>

                    {/* Right Side Nav Links */}
                    <div className="flex gap-16 md:gap-20">
                        <div className="flex flex-col gap-4">
                            <a href="#" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150 group cursor-pointer font-medium">
                                <span className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-150">→</span> How it works
                            </a>
                            <a href="#" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150 group cursor-pointer font-medium">
                                <span className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-150">→</span> Examples
                            </a>
                            <a href="#" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150 group cursor-pointer font-medium">
                                <span className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-150">→</span> GitHub
                            </a>
                            <a href="https://github.com/arjun-713/DevDocs-AI#readme" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150 group cursor-pointer font-medium">
                                <span className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-150">→</span> How to use
                            </a>
                            <a href="#" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150 group cursor-pointer font-medium">
                                <span className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-150">→</span> Built with
                            </a>
                        </div>
                    </div>
                </div>

                {/* Animated Flow Diagram Mockup */}
                <div
                    className="relative w-full max-w-4xl mx-auto mt-20 z-10 flex flex-col items-center pb-12"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? `translateY(0)` : `translateY(40px)`,
                        transition: "all 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.2s",
                    }}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes flow-dots { 0% { background-position: 0 0; } 100% { background-position: -24px 0; } }
                        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); } }
                        @keyframes chunk-split { 0%, 20% { opacity: 0; transform: translateY(4px); } 30%, 80% { opacity: 1; transform: translateY(0); } 90%, 100% { opacity: 0; transform: translateY(-4px); } }
                        @keyframes vector-scan { 0%, 100% { opacity: 0.2; } 20% { opacity: 1; background: #3b82f6; } }
                        .connector-line { background-image: radial-gradient(circle, #3b82f6 2px, transparent 2.5px); background-size: 12px 10px; background-position: 0 center; background-repeat: repeat-x; height: 4px; border-radius: 4px; animation: flow-dots 1.5s linear infinite; opacity: 0.6; }
                    `}} />

                    {/* Diagram Container */}
                    <div className="w-full h-32 relative flex items-center justify-between px-8 bg-white/60 rounded-3xl backdrop-blur-md border border-white/40 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]">

                        {/* 1. GitHub Repo Node */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-24">
                            <div className="w-[52px] h-[52px] bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center shrink-0">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-gray-800"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 absolute -bottom-8 whitespace-nowrap text-center">github.com/...</span>
                        </div>

                        {/* Connector */}
                        <div className="flex-1 connector-line mx-2"></div>

                        {/* 2. Chunking Node */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-24">
                            <div className="w-[52px] h-[52px] bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center shrink-0 relative overflow-hidden">
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2px]">
                                    <div className="w-5 h-1.5 bg-gray-800 rounded-sm" style={{ animation: "chunk-split 3s ease infinite 0s" }}></div>
                                    <div className="w-5 h-1.5 bg-gray-800 rounded-sm" style={{ animation: "chunk-split 3s ease infinite 0.2s" }}></div>
                                    <div className="w-5 h-1.5 bg-gray-800 rounded-sm" style={{ animation: "chunk-split 3s ease infinite 0.4s" }}></div>
                                </div>
                                {/* Base document outline that stays */}
                                <div className="w-5 border-t-2 border-dashed border-gray-300 absolute"></div>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 absolute -bottom-8 whitespace-nowrap text-center">Chunked</span>
                        </div>

                        {/* Connector */}
                        <div className="flex-1 connector-line mx-2" style={{ animationDelay: "-0.5s" }}></div>

                        {/* 3. Vector/Embed Node */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-24">
                            <div className="w-[52px] h-[52px] bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center shrink-0">
                                <div className="grid grid-cols-3 gap-1 p-0.5">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300"
                                            style={{ animation: `vector-scan 2.5s infinite ${i * 0.15}s` }}></div>
                                    ))}
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 absolute -bottom-8 whitespace-nowrap text-center">Indexed</span>
                        </div>

                        {/* Connector */}
                        <div className="flex-1 connector-line mx-2" style={{ animationDelay: "-1s" }}></div>

                        {/* 4. Search/Query Node */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-24">
                            <div className="w-[52px] h-[52px] bg-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-100 flex items-center justify-center shrink-0 relative" style={{ animation: "pulse-glow 3s infinite" }}>
                                <Search className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 absolute -bottom-8 whitespace-nowrap text-center">Queried</span>
                        </div>

                        {/* Connector */}
                        <div className="flex-1 connector-line mx-2" style={{ animationDelay: "-1.5s" }}></div>

                        {/* 5. Answer Node */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-24">
                            <div className="w-[52px] h-[52px] bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center shrink-0 relative">
                                <div className="flex flex-col gap-1 w-6">
                                    <div className="w-[70%] h-1 bg-gray-400 rounded"></div>
                                    <div className="w-full h-1 bg-gray-400 rounded"></div>
                                    <div className="w-[50%] h-1.5 bg-blue-100 border border-blue-200 rounded mt-0.5"></div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-sm text-white">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 absolute -bottom-8 whitespace-nowrap text-center">Answered</span>
                        </div>

                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-300 pt-5 mt-4 flex flex-col sm:flex-row gap-4 justify-between items-center relative z-10">
                    <p className="text-xs text-gray-400 font-medium tracking-wide">© 2026 DevDocs AI. Not affiliated with any indexed repositories.</p>
                    <div className="flex gap-6">
                        <a href="https://github.com/maliik" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium cursor-pointer">Built by Mallik · GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
