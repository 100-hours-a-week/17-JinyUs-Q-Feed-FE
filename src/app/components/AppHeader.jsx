import React from 'react';
import { useNavigate } from 'react-router-dom';
import svgPaths from "@/imports/svg-h6m3rufpzr";
import { Settings, Bell } from 'lucide-react';
import { useUnreadNotification } from '@/context/UnreadNotificationContext';

function BellButton({ onNotification, isDark }) {
    const { hasUnread } = useUnreadNotification()
    return (
        <button
            onClick={onNotification}
            className={`relative size-[32px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            aria-label={hasUnread ? '알림, 미읽음 있음' : '알림'}
        >
            <Bell className="w-5 h-5" />
            {hasUnread && (
                <span
                    aria-hidden="true"
                    className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full pointer-events-none"
                />
            )}
        </button>
    )
}

export const AppHeader = ({
    title,
    showBack = true,
    showNotifications,
    showSettings,
    align = 'center',
    onBack,
    onNotification,
    onSetting,
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
    const isLeftAligned = align === 'left';

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
            <div
                className={`z-10 ${
                    !showBack && isLeftAligned
                        ? 'w-0 min-w-0'
                        : 'min-w-[40px] flex items-center justify-start'
                }`}
            >
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
            <div
                className={`flex-1 flex items-center px-2 overflow-hidden z-0 ${
                    isLeftAligned ? 'justify-start' : 'justify-center'
                }`}
            >
                <p
                    className={`font-['Pretendard','Inter',sans-serif] font-bold text-[20px] text-current truncate ${
                        isLeftAligned ? 'text-left' : 'text-center'
                    }`}
                >
                    {title}
                </p>
            </div>

            {/* Right Slot: Settings + Notification */}
            <div className="min-w-[40px] flex items-center justify-end gap-1 z-10">
                {rightContent ? (
                    rightContent
                ) : (
                    <>
                        {showSettings && (
                            <button
                                onClick={onSetting}
                                className={`size-[32px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                aria-label="설정"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        )}
                        {showNotifications && (
                            <BellButton onNotification={onNotification} isDark={isDark} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
