import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';
import {
    getPracticeFeedbackStorageKey,
    PRACTICE_FEEDBACK_UPDATED_EVENT,
    SESSION_STORAGE_KEYS,
} from '@/app/constants/storageKeys';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';
const TEXT_SUBMITTING = '답변을 제출하고 분석 요청을 준비하고 있어요...';
const TEXT_ANALYZING = 'AI가 답변을 분석중이에요...';
const TEXT_ERROR_FALLBACK = '피드백 요청에 실패했습니다.';
const TEXT_ERROR_PARSE = '피드백 결과를 불러오는 중 오류가 발생했습니다.';
const TEXT_ERROR_TIMEOUT = '피드백 생성이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
const TEXT_ERROR_MISSING_REQUEST = '피드백 요청 정보를 찾을 수 없습니다. 다시 답변을 제출해주세요.';
const TEXT_BACK_MODAL_TITLE = 'AI가 답변 분석 중입니다.';
const TEXT_BACK_MODAL_DESC = '연습모드로 돌아가시겠습니까?';
const TEXT_BACK_MODAL_CONFIRM = '연습모드로 돌아가기';
const TEXT_BACK_MODAL_CANCEL = '닫기';
const TEXT_RESULT_BUTTON = 'AI 분석결과 보기';
const TEXT_RETRY_BUTTON = '다시 답변하기';
const TEXT_PAGE_TITLE = '답변 분석';
const TEXT_QUESTION_LABEL = '질문';
const TEXT_MY_ANSWER_LABEL = '나의 답변';
const TEXT_KEYWORD_TITLE = '핵심 키워드 분석';
const TEXT_KEYWORD_HELP = '답변에서 반영된 키워드와 보완이 필요한 키워드를 확인해보세요';
const TEXT_KEYWORD_COVERED = '반영된 키워드';
const TEXT_KEYWORD_MISSING = '보완이 필요한 키워드';
const TEXT_KEYWORD_COVERAGE = '키워드 커버리지';
const TEXT_KEYWORD_NONE = '모든 핵심 키워드를 반영했어요.';
const TEXT_PROGRESS_SUFFIX = '%';

const PRACTICE_SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS.PRACTICE_INTERVIEW_SESSION;

const FEEDBACK_WAIT_TIMEOUT_MS = 60 * 1000;
const STORAGE_STATUS_PENDING = 'pending';
const STORAGE_STATUS_DONE = 'done';
const STORAGE_STATUS_ERROR = 'error';

const PROGRESS_WAIT_MAX = 95;
const PROGRESS_WAIT_STEP = 3;
const PROGRESS_WAIT_INTERVAL_MS = 500;
const PROGRESS_COMPLETE = 100;
const PROGRESS_COMPLETE_STEP = 1;
const PROGRESS_COMPLETE_INTERVAL_MS = 50;

const safeRemoveSessionKey = () => {
    try {
        sessionStorage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    } catch {
        // sessionStorage 사용 불가 환경에서는 무시
    }
};

const PracticeResultKeyword = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { state } = useLocation();

    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showBackModal, setShowBackModal] = useState(false);
    const [feedbackResponse, setFeedbackResponse] = useState(null);
    const [feedbackError, setFeedbackError] = useState('');
    const [analysisStatusText, setAnalysisStatusText] = useState(TEXT_SUBMITTING);

    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);

    const myAnswer = state?.answerText || '';
    const retryPath = state?.retryPath || `/practice/answer/${questionId}`;
    const retryState = myAnswer
        ? { prefillAnswerText: myAnswer }
        : undefined;

    const keywordResult = feedbackResponse?.data?.keyword_result;

    const coveredKeywords = useMemo(() => {
        return Array.isArray(keywordResult?.covered_keywords)
            ? keywordResult.covered_keywords.filter((keyword) => typeof keyword === 'string' && keyword.trim())
            : [];
    }, [keywordResult]);

    const missingKeywords = useMemo(() => {
        return Array.isArray(keywordResult?.missing_keywords)
            ? keywordResult.missing_keywords.filter((keyword) => typeof keyword === 'string' && keyword.trim())
            : [];
    }, [keywordResult]);
    const fallbackKeywords = Array.isArray(question?.keywords)
        ? question.keywords.filter((keyword) => typeof keyword === 'string' && keyword.trim())
        : [];

    const coveragePercent = useMemo(() => {
        const ratio = keywordResult?.coverage_ratio;
        if (typeof ratio !== 'number') return null;
        const clamped = Math.max(0, Math.min(1, ratio));
        return Math.round(clamped * 100);
    }, [keywordResult]);

    useEffect(() => {
        if (!isAnalyzing) return undefined;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= PROGRESS_WAIT_MAX) return PROGRESS_WAIT_MAX;
                return Math.min(PROGRESS_WAIT_MAX, prev + PROGRESS_WAIT_STEP);
            });
        }, PROGRESS_WAIT_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [isAnalyzing]);

    useEffect(() => {
        const storageKey = getPracticeFeedbackStorageKey(questionId);
        let disposed = false;
        let timeoutId = null;

        const clearWatchdog = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        const stopWatching = () => {
            disposed = true;
            clearWatchdog();
        };

        const finalizeSuccess = (response) => {
            setIsAnalyzing(false);
            setFeedbackResponse(response);
            sessionStorage.removeItem(storageKey);
            stopWatching();
        };

        const finalizeError = (message) => {
            setIsAnalyzing(false);
            setFeedbackError(message || TEXT_ERROR_FALLBACK);
            sessionStorage.removeItem(storageKey);
            stopWatching();
        };

        const applyStoredState = () => {
            if (disposed) return;

            const raw = sessionStorage.getItem(storageKey);
            if (!raw) {
                finalizeError(TEXT_ERROR_MISSING_REQUEST);
                return;
            }

            try {
                const data = JSON.parse(raw);

                if (data.status === STORAGE_STATUS_DONE && data.response) {
                    finalizeSuccess(data.response);
                    return;
                }

                if (data.status === STORAGE_STATUS_ERROR) {
                    finalizeError(data.message || TEXT_ERROR_FALLBACK);
                    return;
                }

                if (data.status !== STORAGE_STATUS_PENDING) {
                    finalizeError(TEXT_ERROR_PARSE);
                    return;
                }

                const sessionId = data.sessionId;
                if (!sessionId) {
                    finalizeError(TEXT_ERROR_PARSE);
                    return;
                }

                const createdAt = Date.parse(data.createdAt || '');
                if (Number.isFinite(createdAt) && Date.now() - createdAt >= FEEDBACK_WAIT_TIMEOUT_MS) {
                    finalizeError(TEXT_ERROR_TIMEOUT);
                    return;
                }

                if (data.requestedAt) {
                    setAnalysisStatusText(TEXT_ANALYZING);
                } else {
                    setAnalysisStatusText(TEXT_SUBMITTING);
                }
            } catch {
                finalizeError(TEXT_ERROR_PARSE);
            }
        };

        const handleFeedbackUpdated = (event) => {
            if (disposed) return;
            if (event?.detail?.storageKey !== storageKey) return;
            applyStoredState();
        };

        timeoutId = setTimeout(() => {
            if (disposed) return;
            finalizeError(TEXT_ERROR_TIMEOUT);
        }, FEEDBACK_WAIT_TIMEOUT_MS);

        if (typeof window !== 'undefined') {
            window.addEventListener(PRACTICE_FEEDBACK_UPDATED_EVENT, handleFeedbackUpdated);
        }

        applyStoredState();

        return () => {
            stopWatching();
            if (typeof window !== 'undefined') {
                window.removeEventListener(PRACTICE_FEEDBACK_UPDATED_EVENT, handleFeedbackUpdated);
            }
        };
    }, [questionId]);

    useEffect(() => {
        if (!feedbackResponse) return undefined;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= PROGRESS_COMPLETE) {
                    clearInterval(interval);
                    return PROGRESS_COMPLETE;
                }
                return Math.min(PROGRESS_COMPLETE, prev + PROGRESS_COMPLETE_STEP);
            });
        }, PROGRESS_COMPLETE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [feedbackResponse]);

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    const handleBackClick = () => {
        if (isAnalyzing) {
            setShowBackModal(true);
            return;
        }

        safeRemoveSessionKey();
        navigate('/practice');
    };

    const hasAnalyzedKeywordData = coveredKeywords.length > 0 || missingKeywords.length > 0;

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title={TEXT_PAGE_TITLE}
                onBack={handleBackClick}
                showNotifications={false}
            />

            <div className="p-6 max-w-lg mx-auto space-y-4">
                <Card className="p-4 bg-gray-50">
                    <p className="text-sm text-muted-foreground mb-1">{TEXT_QUESTION_LABEL}</p>
                    <p>{question.title}</p>
                </Card>

                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">{TEXT_MY_ANSWER_LABEL}</p>
                    <div className="h-[300px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
                        {myAnswer}
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-rose-50 to-white space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-pink-600" />
                        <h3>{TEXT_KEYWORD_TITLE}</h3>
                    </div>

                    {coveragePercent !== null && !isAnalyzing && (
                        <div className="rounded-lg bg-white/80 px-3 py-2 text-sm text-rose-900">
                            {TEXT_KEYWORD_COVERAGE}: <span className="font-semibold">{coveragePercent}%</span>
                        </div>
                    )}

                    {isAnalyzing || !hasAnalyzedKeywordData ? (
                        <div className="flex flex-wrap gap-2">
                            {fallbackKeywords.map((keyword, idx) => (
                                <Badge
                                    key={`${keyword}-${idx}`}
                                    variant="secondary"
                                    className="bg-rose-100 text-rose-700 px-3 py-1"
                                >
                                    #{keyword}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 mb-2">{TEXT_KEYWORD_COVERED}</p>
                                <div className="flex flex-wrap gap-2">
                                    {coveredKeywords.map((keyword, idx) => (
                                        <Badge
                                            key={`covered-${keyword}-${idx}`}
                                            variant="secondary"
                                            className="bg-emerald-100 text-emerald-700 px-3 py-1"
                                        >
                                            #{keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-amber-700 mb-2">{TEXT_KEYWORD_MISSING}</p>
                                {missingKeywords.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {missingKeywords.map((keyword, idx) => (
                                            <Badge
                                                key={`missing-${keyword}-${idx}`}
                                                variant="secondary"
                                                className="bg-amber-100 text-amber-700 px-3 py-1"
                                            >
                                                #{keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">{TEXT_KEYWORD_NONE}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">{TEXT_KEYWORD_HELP}</p>
                </Card>

                {isAnalyzing ? (
                    <Card className="p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <p className="mb-4">{analysisStatusText}</p>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {progress}{TEXT_PROGRESS_SUFFIX}
                            </p>
                        </div>
                    </Card>
                ) : feedbackError ? (
                    <div className="space-y-3">
                        <div className="text-center text-rose-500 text-sm py-2">
                            {feedbackError}
                        </div>
                        <Button
                            onClick={() => {
                                safeRemoveSessionKey();
                                navigate(retryPath, retryState ? { state: retryState } : undefined);
                            }}
                            className="w-full rounded-xl h-12"
                        >
                            {TEXT_RETRY_BUTTON}
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => navigate(`/practice/result-ai/${questionId}`, {
                            state: { feedbackResponse, answerText: myAnswer },
                        })}
                        className="w-full rounded-md h-12"
                        disabled={!feedbackResponse}
                    >
                        {TEXT_RESULT_BUTTON}
                    </Button>
                )}
            </div>

            <AlertDialog open={showBackModal} onOpenChange={setShowBackModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{TEXT_BACK_MODAL_TITLE}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {TEXT_BACK_MODAL_DESC}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{TEXT_BACK_MODAL_CANCEL}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                safeRemoveSessionKey();
                                navigate('/practice');
                            }}
                        >
                            {TEXT_BACK_MODAL_CONFIRM}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PracticeResultKeyword;
