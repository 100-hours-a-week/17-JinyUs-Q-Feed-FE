import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { ThumbsUp, AlertCircle, Home, Target } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from 'recharts';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';
import { usePracticeQuestion } from '@/context/practiceQuestionContext.jsx';
import { SESSION_STORAGE_KEYS } from '@/app/constants/storageKeys';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';
const TEXT_BAD_CASE_FALLBACK = '답변을 다시 확인해주세요.';
const TEXT_STRENGTHS_TITLE = '잘한 점';
const TEXT_IMPROVEMENTS_TITLE = '개선하면 좋은 점';
const TEXT_COMPLETE_TITLE = '분석 완료!';
const TEXT_COMPLETE_DESC = '답변을 꼼꼼히 분석했어요';
const TEXT_HOME_BUTTON = '홈으로 이동';
const TEXT_AI_FEEDBACK_TITLE = 'AI 피드백';
const TEXT_BAD_CASE_STRENGTHS = '더 잘 할 수 있어요. 지금의 시도가 충분히 의미 있습니다.';
const TEXT_BAD_CASE_IMPROVEMENTS = '조금만 더 자세히 설명해도 충분히 좋아질 수 있어요.';
const TEXT_RADAR_LABEL = '평가';

const FEEDBACK_SPLIT_DELIMITER = '●';
const FEEDBACK_BULLET = '•';
const FEEDBACK_DASH = '-';
const PRACTICE_SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS.PRACTICE_INTERVIEW_SESSION;

const RADAR_DOMAIN_MAX = 100;
const METRIC_SCORE_MAX = 5;

const normalizeScore = (score) => {
    if (typeof score !== 'number' || Number.isNaN(score)) return 0;
    const clamped = Math.max(0, Math.min(METRIC_SCORE_MAX, score));
    return Math.round((clamped / METRIC_SCORE_MAX) * RADAR_DOMAIN_MAX);
};

const splitFeedbackText = (text) => {
    if (typeof text !== 'string') return [];
    const normalized = text.replace(/\n+/g, '\n').trim();
    if (!normalized) return [];
    return normalized
        .split(FEEDBACK_SPLIT_DELIMITER)
        .map((line) => line.trim())
        .filter(Boolean);
};

const PracticeResultAI = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { state } = useLocation();

    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);
    const { clearSelectedQuestion } = usePracticeQuestion();

    const feedbackResponse = state?.feedbackResponse;
    const feedbackData = useMemo(() => feedbackResponse?.data ?? null, [feedbackResponse]);

    const metrics = useMemo(() => {
        return Array.isArray(feedbackData?.metrics)
            ? feedbackData.metrics.filter((metric) => metric && typeof metric === 'object')
            : [];
    }, [feedbackData]);

    const radarData = useMemo(() => {
        return metrics.map((metric, idx) => ({
            subject: metric?.name || `평가 ${idx + 1}`,
            value: normalizeScore(metric?.score),
        }));
    }, [metrics]);

    const overallFeedback = feedbackData?.overall_feedback ?? {};
    const badCaseFeedback = feedbackData?.bad_case_feedback;
    const failedFeedbackMessage = feedbackData?.status === 'FAILED' ? feedbackData?.message : '';

    const hasRadarData = radarData.length > 0;
    const isBadCase = Boolean(badCaseFeedback) || !hasRadarData;

    const strengthsText =
        overallFeedback?.strengths ||
        badCaseFeedback?.message ||
        failedFeedbackMessage ||
        TEXT_BAD_CASE_STRENGTHS;

    const improvementsText =
        overallFeedback?.improvements ||
        badCaseFeedback?.guidance ||
        TEXT_BAD_CASE_IMPROVEMENTS;

    const renderFeedbackText = (text, className) => {
        const lines = splitFeedbackText(text);

        if (lines.length === 0) {
            return <p className={className}>{TEXT_BAD_CASE_FALLBACK}</p>;
        }

        return (
            <div className={`space-y-2 ${className}`}>
                {lines.map((line, idx) => {
                    const content = line.startsWith(FEEDBACK_DASH)
                        ? line.slice(1).trim()
                        : line;

                    return (
                        <p key={idx} className="leading-relaxed pl-5 relative">
                            <span className="absolute left-0">{FEEDBACK_BULLET}</span>
                            {content}
                        </p>
                    );
                })}
            </div>
        );
    };

    useEffect(() => {
        return () => {
            clearSelectedQuestion();
            try {
                sessionStorage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
            } catch {
                // sessionStorage 사용 불가 환경에서는 무시
            }
        };
    }, [clearSelectedQuestion]);

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title={TEXT_AI_FEEDBACK_TITLE}
                onBack={() => navigate('/practice')}
                showNotifications={false}
                tone="light"
            />

            <div
                className="text-center pb-6 px-6 pt-2"
                style={{
                    background: 'linear-gradient(165deg, var(--primary-50) 0%, var(--primary-100) 50%, var(--primary-50) 100%)',
                }}
            >
                <div className="mb-2 flex justify-center">
                    <Target className="w-14 h-14 text-primary-500" />
                </div>
                <h2 className="text-2xl mb-1 font-semibold text-[var(--gray-900)]">{TEXT_COMPLETE_TITLE}</h2>
                <p className="text-[var(--gray-600)] text-sm">{TEXT_COMPLETE_DESC}</p>
            </div>

            <div className="p-6 max-w-lg mx-auto space-y-4 -mt-4">
                <Card className="p-6 bg-white shadow-lg">
                    {isBadCase ? (
                        <div className="text-center space-y-2">
                            <p className="text-sm text-rose-900 font-medium">
                                {failedFeedbackMessage || badCaseFeedback?.message || TEXT_BAD_CASE_FALLBACK}
                            </p>
                            {(badCaseFeedback?.guidance || overallFeedback?.improvements) && (
                                <p className="text-xs text-rose-700">
                                    {badCaseFeedback?.guidance || overallFeedback?.improvements}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis
                                        angle={90}
                                        domain={[0, RADAR_DOMAIN_MAX]}
                                        tick={false}
                                        axisLine={false}
                                    />
                                    <Radar
                                        name={TEXT_RADAR_LABEL}
                                        dataKey="value"
                                        stroke="#ec4899"
                                        fill="#ec4899"
                                        fillOpacity={0.6}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </Card>

                <Card className="p-5 border-2 border-rose-200 bg-rose-50">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <ThumbsUp className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-2 text-rose-900">{TEXT_STRENGTHS_TITLE}</h3>
                            {renderFeedbackText(strengthsText, 'text-sm text-rose-800')}
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-2 border-pink-200 bg-pink-50">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-2 text-pink-900">{TEXT_IMPROVEMENTS_TITLE}</h3>
                            {renderFeedbackText(improvementsText, 'text-sm text-pink-800')}
                        </div>
                    </div>
                </Card>

                <Button
                    onClick={() => {
                        clearSelectedQuestion();
                        navigate('/');
                    }}
                    className="w-full rounded-md h-12 gap-2"
                >
                    <Home className="w-5 h-5" />
                    {TEXT_HOME_BUTTON}
                </Button>
            </div>
        </div>
    );
};

export default PracticeResultAI;
