"use client";

import React, { useEffect, useRef, useState } from "react";
import { Message, Check, Clock, Bookmark, Hourglass, Calendar, Timer, LightBulb } from "iconoir-react";

const desktopCards = [
    { id: 1, content: <Message className="w-8 h-8 text-blue-400" />, left: "4%", top: 60, rot: -4 },
    { id: 2, content: <span className="font-bold text-2xl text-gray-800">20</span>, left: "14%", top: 20, rot: 3 },
    { id: 3, content: <Check className="w-8 h-8 text-white" strokeWidth={3} />, left: "22%", top: 90, rot: -6, special: true },
    { id: 4, content: <Clock className="w-8 h-8 text-indigo-400" />, left: "33%", top: 30, rot: 5 },
    { id: 5, content: <Bookmark className="w-8 h-8 text-red-500" />, left: "43%", top: 10, rot: -3 },
    { id: 6, content: <Hourglass className="w-8 h-8 text-orange-400" />, left: "53%", top: 75, rot: 7 },
    { id: 7, content: <Calendar className="w-8 h-8 text-green-500" />, left: "63%", top: 20, rot: -5 },
    { id: 8, content: <Timer className="w-8 h-8 text-purple-500" />, left: "72%", top: 60, rot: 4 },
    { id: 9, content: <LightBulb className="w-8 h-8 text-yellow-500" />, left: "82%", top: 15, rot: -3 },
    { id: 10, content: <span className="text-blue-500 text-2xl font-bold">»</span>, left: "91%", top: 70, rot: 6 },
];

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
            className={`w-full bg-[#f0f0f0] relative overflow-hidden px-8 md:px-16 py-10 lg:py-20 transition-all duration-700 ease-out font-dm ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
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

            <div className="max-w-[1800px] mx-auto w-full relative">
                {/* Main Content Row */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0 relative z-10 w-full">
                    {/* Left Side */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-5 h-5 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                            </div>
                            <span className="font-semibold text-gray-900 text-base tracking-tight">DevDocs AI</span>
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
                            <a href="#" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150 group cursor-pointer font-medium">
                                <span className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-150">→</span> Built with
                            </a>
                        </div>
                    </div>
                </div>

                {/* Floating Icon Cards Row (Desktop) */}
                <div className="hidden md:block relative w-full h-72 mt-12 z-10">
                    {desktopCards.map((card, idx) => (
                        <div
                            key={card.id}
                            className={`absolute flex items-center justify-center text-[32px] rounded-2xl shadow-md transition-all duration-700 ease-out border border-black/5 ${card.special ? "bg-blue-500" : "bg-white"}`}
                            style={{
                                width: 72,
                                height: 72,
                                "--r": `${card.rot}deg`,
                                transform: visible ? `translateY(0) rotate(${card.rot}deg)` : `translateY(20px) rotate(${card.rot}deg) scale(0.7)`,
                                animation: visible ? `custom-float ${3 + idx * 0.3}s ease-in-out ${idx * 80}ms infinite` : "none",
                                left: card.left,
                                top: `${card.top}px`,
                                opacity: visible ? 1 : 0,
                                transitionDelay: `${idx * 80}ms`
                            } as React.CSSProperties}
                        >
                            {card.content}
                        </div>
                    ))}
                </div>

                {/* Floating Icon Cards (Mobile representation) */}
                <div className="md:hidden flex flex-wrap justify-center gap-6 mt-16 mb-8 z-10 relative">
                    {desktopCards.slice(0, 6).map((card, idx) => (
                        <div
                            key={card.id}
                            className={`flex items-center justify-center text-[28px] rounded-2xl shadow-md transition-all duration-700 ease-out border border-black/5 shrink-0 ${card.special ? "bg-blue-500" : "bg-white"}`}
                            style={{
                                width: 64,
                                height: 64,
                                "--r": `${card.rot}deg`,
                                transform: visible ? `translateY(0) rotate(${card.rot}deg)` : `translateY(20px) rotate(${card.rot}deg) scale(0.7)`,
                                animation: visible ? `custom-float ${3 + idx * 0.3}s ease-in-out ${idx * 80}ms infinite` : "none",
                                opacity: visible ? 1 : 0,
                                transitionDelay: `${idx * 80}ms`
                            } as React.CSSProperties}
                        >
                            {card.content}
                        </div>
                    ))}
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
