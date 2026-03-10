import React from 'react';

export const LogoIcon = ({ className = "w-full h-full" }: { className?: string }) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Base Document/Chat Shape */}
        <path
            d="M6 4C4.89543 4 4 4.89543 4 6V22C4 23.1046 4.89543 24 6 24H16.5V28.5C16.5 28.9477 17.0423 29.1717 17.3591 28.8548L22.2139 24H24C25.1046 24 26 23.1046 26 22V12L18 4H6Z"
            fill="#2563EB"
        />
        {/* Top Right Fold */}
        <path
            d="M18 4V10C18 11.1046 18.8954 12 20 12H26L18 4Z"
            fill="#93C5FD"
            opacity="0.9"
        />
        {/* Inner lines */}
        <rect x="9" y="11" width="11" height="2.5" rx="1.25" fill="#0F172A" />
        <rect x="9" y="16.5" width="11" height="2.5" rx="1.25" fill="#0F172A" />
    </svg>
);

export const Logo = ({ className = "", forceDarkText = false }: { className?: string; forceDarkText?: boolean }) => (
    <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-8 h-8 rounded-[8px] bg-white shadow-sm border border-gray-100/80 flex items-center justify-center p-1.5 shrink-0">
            <LogoIcon />
        </div>
        <span
            className={`font-sans font-bold text-xl tracking-tight ${forceDarkText ? "text-[#0F172A]" : "text-gray-900"}`}
            style={{ fontFamily: '"Noto Sans", sans-serif' }}
        >
            DevDocs AI
        </span>
    </div>
);
