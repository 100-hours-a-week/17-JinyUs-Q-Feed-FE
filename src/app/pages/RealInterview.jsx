import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import BottomNav from '@/app/components/BottomNav';
import { toast } from 'sonner';

import { AppHeader } from '@/app/components/AppHeader';

const SHOW_PORTFOLIO_INTERVIEW = import.meta.env.VITE_SHOW_PORTFOLIO_INTERVIEW === 'true';

const RealInterview = () => {
    const navigate = useNavigate();

    const handleComingSoon = (title) => {
        toast.info(`${title} 서비스는 현재 준비 중입니다.`, {
            description: "더 나은 경험을 위해 조금만 기다려주세요!",
        });
    };

    const menuItems = [
        {
            title: 'CS 기초',
            description: '운영체제, 네트워크, 데이터베이스 등 핵심 전공 지식',
            gradient: 'from-pink-500 to-rose-500',
        },
        {
            title: '시스템 디자인',
            description: '대규모 아키텍처 및 분산 시스템 설계 연습',
            gradient: 'from-rose-500 to-pink-600',
        },
        ...(SHOW_PORTFOLIO_INTERVIEW
            ? [{
                title: '개별 포트폴리오',
                description: '내 프로젝트 기반의 1:1 맞춤형 기술 면접',
                gradient: 'from-pink-600 to-rose-600',
            }]
            : []),
    ];

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden max-w-lg mx-auto border-x border-transparent">
            {/* Header */}
            <AppHeader title="실전 면접" onBack={() => navigate('/')} />

            {/* 3-Section Buttons */}
            <div className="flex-1 flex flex-col p-4 gap-4 pb-24 min-h-0">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => handleComingSoon(item.title)}
                        className={`flex-1 relative overflow-hidden rounded-2xl p-5 flex flex-col justify-center text-left text-white transition-all active:scale-[0.98] bg-gradient-to-br ${item.gradient} shadow-lg shadow-pink-200/50 min-h-[100px]`}
                    >
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-1">{item.title}</h2>
                            <p className="text-white/80 text-xs leading-relaxed max-w-[200px]">
                                {item.description}
                            </p>
                        </div>

                        {/* Decorative background circle */}
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute top-2 right-4 text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            Coming Soon
                        </div>
                    </button>
                ))}
            </div>

            <BottomNav />
        </div>
    );
};

export default RealInterview;
