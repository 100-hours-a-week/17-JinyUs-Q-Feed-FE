import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BottomNav from '@/app/components/BottomNav';
import { toast } from 'sonner';
import { AppHeader } from '@/app/components/AppHeader';
import { createInterviewSession } from '@/api/interviewApi';
import { SESSION_STORAGE_KEYS } from '@/app/constants/storageKeys';
import { INTERVIEW_TYPES, QUESTION_TYPES } from '@/app/constants/interviewTaxonomy';
import { useAuth } from '@/context/AuthContext';

const SHOW_PORTFOLIO_INTERVIEW = import.meta.env.VITE_SHOW_PORTFOLIO_INTERVIEW === 'true';
const REAL_SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS.REAL_INTERVIEW_SESSION;
const TEXT_SESSION_CREATE_FAILED = '면접 세션 생성에 실패했습니다.';
const TEXT_SESSION_CREATING = '실전면접 준비 중';
const DEFAULT_REAL_USER_ID = 1;

const safeSetSessionItem = (key, value) => {
    try {
        sessionStorage.setItem(key, value);
    } catch {
        // sessionStorage 사용 불가 환경에서는 무시한다.
    }
};

const normalizeTurnType = (value, fallback = 'main') => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized || fallback;
};

const resolveUserIdFromAccessToken = (token) => {
    if (!token) return DEFAULT_REAL_USER_ID;

    const parts = token.split('.');
    if (parts.length < 2) return DEFAULT_REAL_USER_ID;

    try {
        const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(
            normalized.length + (4 - (normalized.length % 4 || 4)) % 4,
            '='
        );
        const payload = JSON.parse(atob(padded));
        const candidates = [
            payload?.userId,
            payload?.user_id,
            payload?.memberId,
            payload?.member_id,
            payload?.id,
            payload?.sub,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'number' && Number.isInteger(candidate)) {
                return candidate;
            }
            if (typeof candidate === 'string' && /^\d+$/.test(candidate.trim())) {
                return Number(candidate.trim());
            }
        }
    } catch {
        return DEFAULT_REAL_USER_ID;
    }

    return DEFAULT_REAL_USER_ID;
};

const saveRealInterviewSession = ({ userId, questionType, sessionData }) => {
    const sessionId = sessionData?.session_id ?? sessionData?.sessionId;
    if (!sessionId) return;

    const questionText = sessionData?.question_text ?? sessionData?.questionText ?? '';
    const turnType = normalizeTurnType(sessionData?.turn_type ?? sessionData?.turnType, 'main');
    const turnOrderRaw = sessionData?.turn_order ?? sessionData?.turnOrder;
    const turnOrder = Number.isInteger(turnOrderRaw) ? turnOrderRaw : 0;
    const resolvedQuestionType = sessionData?.question_type ?? sessionData?.questionType ?? questionType;

    safeSetSessionItem(
        REAL_SESSION_STORAGE_KEY,
        JSON.stringify({
            user_id: userId,
            session_id: String(sessionId),
            interview_type: INTERVIEW_TYPES.REAL,
            question_type: resolvedQuestionType,
            current_question: {
                question: questionText,
                turn_type: turnType,
                turn_order: turnOrder,
                topic_id: sessionData?.topic_id ?? sessionData?.topicId ?? null,
                category: sessionData?.category ?? '',
            },
            interview_history: [],
            expires_at: sessionData?.expires_at ?? sessionData?.expiresAt ?? null,
            created_at: new Date().toISOString(),
        })
    );
};

const RealInterview = () => {
    const navigate = useNavigate();
    const { accessToken } = useAuth();
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    const handleComingSoon = (title) => {
        toast.info(`${title} 서비스는 현재 준비 중입니다.`, {
            description: '더 나은 경험을 위해 조금만 기다려주세요!',
        });
    };

    const handleStartRealInterview = async (questionType) => {
        if (isCreatingSession) return;

        setIsCreatingSession(true);
        try {
            const sessionResponse = await createInterviewSession({
                interviewType: INTERVIEW_TYPES.REAL,
                questionType,
            });

            const sessionData = sessionResponse?.data ?? {};
            const sessionId = sessionData?.session_id ?? sessionData?.sessionId;
            if (!sessionId) {
                throw new Error(TEXT_SESSION_CREATE_FAILED);
            }

            const userId = resolveUserIdFromAccessToken(accessToken);
            saveRealInterviewSession({
                userId,
                questionType,
                sessionData,
            });

            navigate('/real-interview/session');
        } catch (error) {
            toast.error(error?.message || TEXT_SESSION_CREATE_FAILED);
        } finally {
            setIsCreatingSession(false);
        }
    };

    const menuItems = [
        {
            title: 'CS 기초',
            description: '운영체제, 네트워크, 데이터베이스 등 핵심 전공 지식',
            questionType: QUESTION_TYPES.CS,
            gradient: 'from-pink-500 to-rose-500',
            onClick: () => handleStartRealInterview(QUESTION_TYPES.CS),
        },
        {
            title: '시스템 디자인',
            description: '대규모 아키텍처 및 분산 시스템 설계 연습',
            questionType: QUESTION_TYPES.SYSTEM_DESIGN,
            gradient: 'from-rose-500 to-pink-600',
            onClick: () => handleStartRealInterview(QUESTION_TYPES.SYSTEM_DESIGN),
        },
        ...(SHOW_PORTFOLIO_INTERVIEW
            ? [
                {
                    title: '개별 포트폴리오',
                    description: '내 프로젝트 기반의 1:1 맞춤형 기술 면접',
                    questionType: QUESTION_TYPES.PORTFOLIO,
                    gradient: 'from-pink-600 to-rose-600',
                    onClick: () => handleComingSoon('개별 포트폴리오'),
                },
            ]
            : []),
    ];

    return (
        <div className="relative flex flex-col h-screen bg-background overflow-hidden max-w-lg mx-auto border-x border-transparent">
            <AppHeader title="실전 면접" onBack={() => navigate('/')} />

            <div className="flex-1 flex flex-col p-4 gap-4 pb-24 min-h-0">
                {menuItems.map((item, index) => {
                    return (
                        <button
                            key={index}
                            onClick={item.onClick}
                            disabled={isCreatingSession}
                            className={`flex-1 relative overflow-hidden rounded-2xl p-5 flex flex-col justify-center text-left text-white transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-br ${item.gradient} shadow-lg shadow-pink-200/50 min-h-[100px]`}
                        >
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold mb-1">{item.title}</h2>
                                <p className="text-white/80 text-xs leading-relaxed max-w-[200px]">
                                    {item.description}
                                </p>
                            </div>

                            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                            {item.title === '개별 포트폴리오' && (
                                <div className="absolute top-2 right-4 text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Coming Soon
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <BottomNav />

            {isCreatingSession && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-center justify-center">
                    <div className="inline-flex items-center gap-2.5 rounded-full bg-black/45 px-4 py-2.5 text-sm font-medium text-white">
                        <Loader2 size={18} className="animate-spin" />
                        <span>{TEXT_SESSION_CREATING}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RealInterview;
