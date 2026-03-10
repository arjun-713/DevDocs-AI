"use client";

import React, { useEffect, useRef, useState } from "react";

import { Star, GitFork } from "iconoir-react";

const repos = [
    { org: "vercel", name: "next.js", stars: "118k", forks: "26k", lang: "TypeScript", langColor: "#3178c6", icon: "▲" },
    { org: "huggingface", name: "transformers", stars: "127k", forks: "25k", lang: "Python", langColor: "#3572A5", icon: "◈" },
    { org: "langchain-ai", name: "langchain", stars: "89k", forks: "14k", lang: "Python", langColor: "#3572A5", icon: "⚲" },
    { org: "supabase", name: "supabase", stars: "67k", forks: "6k", lang: "TypeScript", langColor: "#3178c6", icon: "↯" },
    { org: "kubernetes", name: "kubernetes", stars: "107k", forks: "38k", lang: "Go", langColor: "#00ADD8", icon: "☸" },
    { org: "pytorch", name: "pytorch", stars: "78k", forks: "21k", lang: "Python", langColor: "#3572A5", icon: "❖" },
    { org: "microsoft", name: "vscode", stars: "160k", forks: "28k", lang: "TypeScript", langColor: "#3178c6", icon: "⬡" },
    { org: "openai", name: "openai-python", stars: "22k", forks: "3k", lang: "Python", langColor: "#3572A5", icon: "◎" },
    { org: "facebook", name: "react", stars: "220k", forks: "45k", lang: "JavaScript", langColor: "#f1e05a", icon: "⚛" },
    { org: "denoland", name: "deno", stars: "93k", forks: "5k", lang: "Rust", langColor: "#dea584", icon: "◈" },
    { org: "hashicorp", name: "terraform", stars: "41k", forks: "9k", lang: "Go", langColor: "#00ADD8", icon: "◈" },
    { org: "apache", name: "spark", stars: "38k", forks: "27k", lang: "Scala", langColor: "#c22d40", icon: "✦" },
    { org: "docker", name: "compose", stars: "33k", forks: "5k", lang: "Go", langColor: "#00ADD8", icon: "◫" },
    { org: "tensorflow", name: "tensorflow", stars: "184k", forks: "74k", lang: "C++", langColor: "#f34b7d", icon: "◆" },
];

const baseRow1 = repos.slice(0, 7);
const baseRow2 = repos.slice(7, 14);

// Duplicate to ensure the track is wide enough for ultra-wide screens
const cycle1 = [...baseRow1, ...baseRow1];
const cycle2 = [...baseRow2, ...baseRow2];

// Double it one more time so it can seamless loop via translateX(-50%)
const row1 = [...cycle1, ...cycle1];
const row2 = [...cycle2, ...cycle2];

const RepoCard = ({ repo }: { repo: typeof repos[0] }) => (
    <div className="w-[240px] h-[96px] shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mx-3 cursor-pointer hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 transition-all duration-200">
        <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100 text-[13px] shadow-sm">
                {repo.icon}
            </div>
            <div className="font-mono text-[13px] font-semibold truncate text-[#0f0f0f]">
                <span className="text-gray-400 font-normal">{repo.org}/</span>
                {repo.name}
            </div>
        </div>
        <div className="flex items-center text-xs text-gray-500 font-dm">
            <div className="flex items-center gap-1.5 mr-3">
                <Star className="w-3.5 h-3.5 text-yellow-500" strokeWidth={2.5} /> {repo.stars}
            </div>
            <div className="flex items-center gap-1.5 mr-4">
                <GitFork className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} /> {repo.forks}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-2 h-2 rounded-full border border-black/5" style={{ backgroundColor: repo.langColor }}></div>
                {repo.lang}
            </div>
        </div>
    </div>
);

export default function GitHubReposSection() {
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
        <section id="works-with" ref={sectionRef} className="w-full bg-[#f5f5f7] py-16 md:py-20 relative font-dm overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 45s linear infinite;
        }
        .scrolling-wrapper:hover > div {
          animation-play-state: paused;
        }
      `}} />

            <div className="max-w-[1800px] mx-auto flex flex-col items-center">

                {/* Header */}
                <div
                    className="flex flex-col items-center mb-10 transition-all duration-[600ms] ease-out px-4"
                    style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(24px)" }}
                >
                    <div className="px-5 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm text-sm text-gray-500 font-medium mb-6">
                        WORKS WITH
                    </div>
                    <h2 className="font-sora text-4xl md:text-5xl font-bold text-gray-900 text-center tracking-tight mb-4 leading-tight">
                        Works on any repo<br className="hidden md:block" /> your team already relies on.
                    </h2>
                    <p className="text-gray-500 text-base md:text-lg text-center max-w-2xl px-4 mt-2">
                        React, Next.js, FastAPI, LangChain, Tailwind, Vite, and thousands more.<br className="hidden md:block" /> If it has docs on GitHub, DevDocs AI can read it.
                    </p>
                </div>

                {/* Animated Repo Stream */}
                <div
                    className="relative w-full py-2 transition-all duration-700 delay-200 ease-out"
                    style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(24px)" }}
                >
                    {/* Edge Fade Overlays */}
                    <div className="absolute top-0 bottom-0 left-0 w-[80px] md:w-[240px] bg-gradient-to-r from-[#f5f5f7] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute top-0 bottom-0 right-0 w-[80px] md:w-[240px] bg-gradient-to-l from-[#f5f5f7] to-transparent z-10 pointer-events-none"></div>

                    <div className="w-full flex flex-col gap-5">
                        <div className="w-full overflow-hidden scrolling-wrapper">
                            <div className="flex w-fit animate-scroll-left">
                                {row1.map((repo, i) => <RepoCard key={`row1-${i}`} repo={repo} />)}
                            </div>
                        </div>

                        <div className="w-full overflow-hidden scrolling-wrapper">
                            <div className="flex w-fit animate-scroll-right">
                                {row2.map((repo, i) => <RepoCard key={`row2-${i}`} repo={repo} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
