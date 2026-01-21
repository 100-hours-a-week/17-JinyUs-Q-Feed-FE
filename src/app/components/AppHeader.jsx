import React from 'react';
import { useNavigate } from 'react-router-dom';
import svgPaths from "@/imports/svg-h6m3rufpzr";

export const AppHeader = ({
    title,
    showBack = true,
    showNotifications = true,
    onBack,
    onNotification
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="bg-white sticky top-0 z-50 flex h-[56px] items-center justify-between px-[16px] w-full max-w-lg mx-auto" data-name="header">
            <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.08)] border-b border-solid inset-0 pointer-events-none" />

            {/* Back Button */}
            <div className="w-[40px] flex items-center justify-start z-10">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="size-[32px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="뒤로가기"
                    >
                        <div className="size-[20px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                <g id="Icon">
                                    <path d={svgPaths.p33f6b680} id="Vector" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                    <path d="M15.8333 10H4.16667" id="Vector_2" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                </g>
                            </svg>
                        </div>
                    </button>
                )}
            </div>

            {/* Page Title */}
            <div className="flex-1 flex items-center justify-center px-2 overflow-hidden z-0">
                <p className="font-['Pretendard','Inter',sans-serif] font-bold text-[20px] text-black text-center truncate">
                    {title}
                </p>
            </div>

            {/* Notification Button */}
            <div className="w-[40px] flex items-center justify-end z-10">
                {showNotifications && (
                    <button
                        onClick={onNotification}
                        className="size-[32px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="알림"
                    >
                        <div className="size-[20px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                                <path d={svgPaths.p15aa46c0} fill="#1D1B20" id="icon" />
                            </svg>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};
