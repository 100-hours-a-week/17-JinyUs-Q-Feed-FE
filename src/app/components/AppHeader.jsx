import React from 'react';
import { useNavigate } from 'react-router-dom';
import svgPaths from "@/imports/svg-h6m3rufpzr";

export const AppHeader = ({
    title,
    showBack = true,
    showNotifications = true,
    onBack,
    onNotification,
    rightContent,
    tone = 'light',
    className = ''
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const isDark = tone === 'dark';

    return (
        <div
            className={`sticky top-0 z-50 flex h-[56px] items-center justify-between px-[16px] w-full max-w-lg mx-auto ${isDark ? 'bg-transparent text-white' : 'bg-white text-black'} ${className}`}
            data-name="header"
        >
            <div
                aria-hidden="true"
                className={`absolute border-b border-solid inset-0 pointer-events-none ${isDark ? 'border-[rgba(255,255,255,0.16)]' : 'border-[rgba(0,0,0,0.08)]'}`}
            />

            {/* Back Button */}
            <div className="min-w-[40px] flex items-center justify-start z-10">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className={`size-[32px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                        aria-label="뒤로가기"
                    >
                        <div className="size-[20px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                <g id="Icon">
                                    <path d={svgPaths.p33f6b680} id="Vector" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                    <path d="M15.8333 10H4.16667" id="Vector_2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                </g>
                            </svg>
                        </div>
                    </button>
                )}
            </div>

            {/* Page Title */}
            <div className="flex-1 flex items-center justify-center px-2 overflow-hidden z-0">
                <p className="font-['Pretendard','Inter',sans-serif] font-bold text-[20px] text-current text-center truncate">
                    {title}
                </p>
            </div>

            {/* Notification Button */}
            <div className="min-w-[40px] flex items-center justify-end z-10">
                {rightContent ? (
                    rightContent
                ) : (
                    showNotifications && (
                        <button
                            onClick={onNotification}
                            className={`size-[32px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            aria-label="알림"
                        >
                            <div className="size-[20px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                                    <path d={svgPaths.p15aa46c0} fill="currentColor" id="icon" />
                                </svg>
                            </div>
                        </button>
                    )
                )}
            </div>
        </div>
    );
};
