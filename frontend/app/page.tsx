"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Page as PageIcon, Link as LinkIcon, Sparks } from "iconoir-react";
import HowItWorksSection from "./components/HowItWorksSection";
import FeaturesSection from "./components/FeaturesSection";
import GitHubReposSection from "./components/GitHubReposSection";
import Footer from "./components/Footer";

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleChipClick = (text: string) => {
    setInputValue(text);
    handleSubmit(null, text);
  };

  const handleSubmit = (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || inputValue;
    if (!text.trim()) return;

    if (!isExpanded) setIsExpanded(true);

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "I've analyzed your repo. The core architecture relies on an event-driven system using React hooks.",
        "Here is a summary of the authentication flow: it uses JWT tokens stored in HTTP-only cookies.",
        "Yes, the project supports Docker. You can run `docker-compose up` to start all services.",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      let currentIdx = 0;
      setMessages((prev) => [...prev, { role: "ai", content: "" }]);

      const interval = setInterval(() => {
        if (currentIdx < randomResponse.length) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              { ...last, content: randomResponse.substring(0, currentIdx + 1) },
            ];
          });
          currentIdx++;
        } else {
          clearInterval(interval);
        }
      }, 30);
    }, 1200);
  };

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        
        .font-sora { font-family: 'Sora', sans-serif; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
        
        .dotted-bg {
          background-image: radial-gradient(#e0e0e0 2px, transparent 2px);
          background-size: 24px 24px;
        }

        .dot-bounce {
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }
        .dot-bounce:nth-child(1) { animation-delay: -0.32s; }
        .dot-bounce:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}} />

      <div className="min-h-screen bg-white font-dm pb-8 flex justify-center w-full">
        {/* Main Hero Container */}
        <div
          className="w-[96vw] max-w-[1400px] bg-[#f5f5f7] dotted-bg mt-0 rounded-[2.5rem] px-6 lg:px-12 pb-6 lg:pb-12 pt-0 lg:pt-0 relative overflow-hidden flex flex-col items-center transition-all duration-[800ms] ease-out shadow-sm"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)"
          }}
        >
          {/* Navbar Inside Container */}
          <header className="w-full h-16 bg-white/70 backdrop-blur-md rounded-2xl rounded-t-none flex items-center justify-between px-6 z-50 mb-8 shadow-sm border border-white/50 border-t-0">
            <div className="flex items-center gap-2">
              <div className="flex grid-cols-2 grid-rows-2 gap-[2px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
              </div>
              <span className="font-sora font-bold text-xl text-[#0f0f0f] ml-1">◈ DevDocs AI</span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-[#0f0f0f] transition-colors">How it works</a>
              <a href="#" className="hover:text-[#0f0f0f] transition-colors">Examples</a>
              <a href="#" className="hover:text-[#0f0f0f] transition-colors">GitHub</a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-[#0f0f0f] text-sm font-medium rounded-full shadow-sm transition-all duration-300 flex items-center gap-1.5 group">
                Try it free <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
              </button>
            </div>
          </header>

          {/* Floating UI Widgets */}
          {/* Top Left - AI Summary Sticky Note */}
          <div
            className="hidden lg:flex absolute top-[20%] left-[8%] w-60 h-64 bg-yellow-100 rounded-lg shadow-md p-5 flex-col transform rotate-[-3deg] transition-all duration-700 ease-out z-10"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "rotate(-3deg) translateY(0)" : "rotate(-3deg) translateY(20px)",
              transitionDelay: "100ms"
            }}
          >
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-sm border-2 border-red-600 z-20"></div>
            <div className="flex justify-between items-start mb-2 mt-1">
              <h3 className="font-bold text-gray-800 text-sm">◈ DevDocs AI</h3>
              <Sparks className="w-4 h-4 text-yellow-600 opacity-70" strokeWidth={2} />
            </div>
            <div className="text-[11px] text-gray-800 font-medium leading-snug font-sora flex flex-col gap-2">
              <p><span className="text-gray-500 font-dm text-[10px] uppercase">Query:</span><br />"How does Vite handle HMR?"</p>
              <p><span className="text-gray-500 font-dm text-[10px] uppercase">Answer:</span><br />"Vite uses native ES modules for HMR. When a file changes, only the affected module is invalidated..."</p>
              <p className="flex items-center gap-1 mt-1"><PageIcon className="w-3.5 h-3.5 text-blue-600" /> docs/guide/hmr.md</p>
            </div>
          </div>

          {/* Top Right - Live Chat Preview */}
          <div
            className="hidden lg:flex absolute top-[12%] right-[10%] w-72 bg-white rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] p-4 flex-col transition-all duration-700 ease-out z-10"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "200ms"
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="font-bold text-sm text-gray-800">Cited from</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                <p className="text-[11px] font-mono text-gray-500 mb-1.5">guide/why.md · line 34</p>
                <p className="text-xs text-gray-700 leading-snug italic border-l-2 border-blue-400 pl-2">
                  "...because Vite serves source code over native ESM, the browser takes over..."
                </p>
              </div>
            </div>
          </div>

          {/* Center Content */}
          <div className="flex flex-col items-center mt-6 md:mt-10 w-full max-w-3xl relative z-20">
            {/* Center Product Icon */}
            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-100 flex grid-cols-2 grid-rows-2 gap-[3px] p-3.5 mb-5">
              <div className="w-full h-full rounded-full bg-blue-500"></div>
              <div className="w-full h-full rounded-full bg-gray-800"></div>
              <div className="w-full h-full rounded-full bg-gray-800"></div>
              <div className="w-full h-full rounded-full bg-gray-800"></div>
            </div>

            {/* Headline */}
            <h1 className="font-sora text-4xl md:text-[5rem] leading-[1.1] text-center font-bold tracking-tight text-[#9ca3af] opacity-80 mb-1">
              Ask anything about
            </h1>
            <h1 className="font-sora text-4xl md:text-[5rem] leading-[1.1] text-center font-bold tracking-tight text-[#0f0f0f] mb-4">
              any open-source repo.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-500 text-center mb-6 max-w-2xl font-medium leading-relaxed">
              Paste a GitHub URL. Get instant answers with cited sources.<br className="hidden md:block" />
              No digging through READMEs. No Stack Overflow rabbit holes.
            </p>

            {/* AI Chat Interface */}
            <div
              className={`w-full max-w-2xl bg-white shadow-xl shadow-gray-200/50 border border-gray-200 rounded-[2rem] p-2 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? 'h-[400px]' : 'h-auto'}`}
            >
              {/* Chat Thread Area (Visible only when expanded) */}
              {isExpanded && (
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 mb-2 scrollbar-thin scrollbar-thumb-gray-200">
                  <div className="flex flex-col gap-4 h-full pt-2">
                    {messages.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                        Start a conversation below
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex max-w-[85%] ${msg.role === "user" ? "self-end" : "self-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
                      >
                        {msg.role === "ai" && (
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                            <Sparks className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                            ? "bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-600/20"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                            }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex max-w-[85%] self-start animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                          <Sparks className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-4 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full dot-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full dot-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full dot-bounce"></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

              {/* Primary Input Bar */}
              <form
                onSubmit={(e) => handleSubmit(e)}
                className={`relative flex items-center w-full bg-white rounded-full ${!isExpanded ? 'h-14 shadow-sm border border-gray-100' : 'h-14 mt-auto border-t border-gray-100'} ring-0 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 transition-all duration-300`}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isExpanded ? "Reply..." : "https://github.com/owner/repo"}
                  className="flex-1 h-full pl-6 pr-4 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-[15px] font-medium min-w-0"
                />

                {/* Send Button Right */}
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="h-10 px-5 mr-2 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium pr-4 text-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-50 disabled:hover:shadow-none disabled:hover:bg-blue-600 transition-all duration-300 whitespace-nowrap"
                >
                  Analyze &rarr;
                </button>
              </form>
            </div>

            {/* Suggestion Chips */}
            <div
              className={`flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-4 transition-all duration-500 ${isExpanded ? 'opacity-0 h-0 overflow-hidden mt-0' : 'opacity-100 h-auto'}`}
            >
              <button
                onClick={() => handleChipClick("vitejs/vite")}
                className="bg-white border border-gray-200 text-sm font-medium text-gray-500 rounded-full px-4 py-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:scale-105 transition-all duration-300 shadow-sm"
              >
                vitejs/vite
              </button>
              <button
                onClick={() => handleChipClick("shadcn/ui")}
                className="bg-white border border-gray-200 text-sm font-medium text-gray-500 rounded-full px-4 py-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:scale-105 transition-all duration-300 shadow-sm"
              >
                shadcn/ui
              </button>
              <button
                onClick={() => handleChipClick("fastapi/fastapi")}
                className="bg-white border border-gray-200 text-sm font-medium text-gray-500 rounded-full px-4 py-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:scale-105 transition-all duration-300 shadow-sm"
              >
                fastapi/fastapi
              </button>
              <button
                onClick={() => handleChipClick("langchain-ai/langchain")}
                className="bg-white border border-gray-200 text-sm font-medium text-gray-500 rounded-full px-4 py-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:scale-105 transition-all duration-300 shadow-sm"
              >
                langchain-ai/langchain
              </button>
            </div>

            <div className="h-24"></div> {/* spacer for bottom */}
          </div>
        </div>
      </div>

      <HowItWorksSection />
      <FeaturesSection />
      <GitHubReposSection />
      <Footer />
    </>
  );
}
