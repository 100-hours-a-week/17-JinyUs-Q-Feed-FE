import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BottomNav from '@/app/components/BottomNav';
import { toast } from 'sonner';
import { AppHeader } from '@/app/components/AppHeader';
import { Button } from '@/app/components/ui/button';
import { usePortfolio } from '@/app/hooks/usePortfolio';
import { createInterviewSession } from '@/api/interviewApi';
import { SESSION_STORAGE_KEYS } from '@/app/constants/storageKeys';
import { INTERVIEW_TYPES, QUESTION_TYPES } from '@/app/constants/interviewTaxonomy';

const SHOW_PORTFOLIO_INTERVIEW = import.meta.env.VITE_SHOW_PORTFOLIO_INTERVIEW === 'true';
const SHOW_NOTIFICATIONS = import.meta.env.VITE_SHOW_NOTIFICATIONS === 'true';
const REAL_SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS.REAL_INTERVIEW_SESSION;
const TEXT_SESSION_CREATE_FAILED = '면접 세션 생성에 실패했습니다.';
const TEXT_SESSION_CREATING = '실전면접 준비 중';
const TEXT_PORTFOLIO_REQUIRED = '실전 면접은 포트폴리오 프로젝트를 1개 이상 등록한 뒤 시작할 수 있습니다.';
const TEXT_PORTFOLIO_LOADING = '포트폴리오 프로젝트를 확인하는 중입니다.';
const TEXT_PORTFOLIO_FETCH_FAILED = '포트폴리오 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.';

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

const saveRealInterviewSession = ({ questionType, sessionData }) => {
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
            status: typeof sessionData?.status === 'string' ? sessionData.status : 'IN_PROGRESS',
            expires_at: sessionData?.expires_at ?? sessionData?.expiresAt ?? null,
            created_at: new Date().toISOString(),
        })
    );
};

const RealInterview = () => {
    const navigate = useNavigate();
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const {
        data: portfolio,
        isLoading: isPortfolioLoading,
        isError: isPortfolioError,
        error: portfolioError,
        refetch: refetchPortfolio,
    } = usePortfolio();
    const portfolioProjectCount = portfolio?.projects?.length ?? 0;
    const isPortfolioStartBlocked =
        isPortfolioLoading || isPortfolioError || portfolioProjectCount === 0;
    const canStartRealInterview = !isCreatingSession && !isPortfolioStartBlocked;

    const handleComingSoon = (title) => {
        toast.info(`${title} 서비스는 현재 준비 중입니다.`, {
            description: '더 나은 경험을 위해 조금만 기다려주세요!',
        });
    };

    const handleStartRealInterview = async (questionType) => {
        if (isCreatingSession) return;
        if (isPortfolioLoading) {
            toast.info(TEXT_PORTFOLIO_LOADING);
            return;
        }
        if (isPortfolioError) {
            toast.error(portfolioError?.message || TEXT_PORTFOLIO_FETCH_FAILED);
            return;
        }
        if (portfolioProjectCount === 0) {
            toast.info(TEXT_PORTFOLIO_REQUIRED);
            return;
        }

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

            saveRealInterviewSession({
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
            gradient: 'from-primary-50 via-primary-100 to-secondary-100',
            onClick: () => handleStartRealInterview(QUESTION_TYPES.CS),
        },
        ...(SHOW_PORTFOLIO_INTERVIEW
            ? [
                {
                    title: '개별 포트폴리오',
                    description: '내 프로젝트 기반의 1:1 맞춤형 기술 면접',
                    questionType: QUESTION_TYPES.PORTFOLIO,
                    gradient: 'from-primary-100 via-secondary-100 to-primary-200',
                    onClick: () => handleComingSoon('개별 포트폴리오'),
                },
            ]
            : []),
    ];

    return (
        <div className="relative flex flex-col h-screen bg-background overflow-hidden max-w-lg mx-auto border-x border-transparent">
            <AppHeader title="실전 면접" onBack={() => navigate('/')} showNotifications={SHOW_NOTIFICATIONS} />

            <div className="flex-1 flex flex-col p-4 gap-4 pb-24 min-h-0">
                <section className="rounded-2xl border border-primary-200/80 bg-white/85 p-4 shadow-[0_8px_22px_rgba(255,143,163,0.08)] backdrop-blur-sm">
                    {isPortfolioLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Loader2 size={16} className="animate-spin text-primary-500" />
                            <span>{TEXT_PORTFOLIO_LOADING}</span>
                        </div>
                    ) : isPortfolioError ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-gray-700">
                                {portfolioError?.message || TEXT_PORTFOLIO_FETCH_FAILED}
                            </p>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => refetchPortfolio()}
                                className="w-fit border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
                            >
                                다시 확인
                            </Button>
                        </div>
                    ) : portfolioProjectCount === 0 ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-gray-700">{TEXT_PORTFOLIO_REQUIRED}</p>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => navigate('/portfolio')}
                                className="w-fit"
                            >
                                포트폴리오 관리
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700">
                            현재 등록된 프로젝트 {portfolioProjectCount}개를 기반으로 실전 면접을 시작할 수 있습니다.
                        </p>
                    )}
                </section>

                {menuItems.map((item, index) => {
                    return (
                        <button
                            key={index}
                            onClick={item.onClick}
                            disabled={!canStartRealInterview}
                            className={`flex-1 relative overflow-hidden rounded-2xl p-5 flex flex-col justify-center text-left transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-br ${item.gradient} border border-primary-200/80 shadow-[0_8px_22px_rgba(255,143,163,0.14)] min-h-[100px]`}
                        >
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold mb-1 text-gray-900">{item.title}</h2>
                                <p className="text-gray-700 text-xs leading-relaxed max-w-[200px]">
                                    {item.description}
                                </p>
                            </div>

                            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary-200/45 rounded-full blur-2xl" />

                            {item.title === '개별 포트폴리오' && (
                                <div className="absolute top-2 right-4 text-[10px] font-medium text-primary-700 bg-white/75 border border-primary-200 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Coming Soon
                                </div>
                            )}

                            {!isPortfolioLoading && !isPortfolioError && portfolioProjectCount === 0 && (
                                <div className="absolute bottom-3 right-4 text-[10px] font-medium text-amber-700 bg-white/85 border border-amber-200 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    프로젝트 등록 필요
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
