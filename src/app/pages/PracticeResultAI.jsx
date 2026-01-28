import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { ThumbsUp, AlertCircle, Home } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';
const TEXT_BAD_CASE_TITLE = '답변에 문제가 있어요';

const PracticeResultAI = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { state } = useLocation();
    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);

    const feedbackResponse = state?.feedbackResponse;
    const feedbackData = feedbackResponse?.data;
    const badCaseFeedback = feedbackData?.bad_case_feedback;
    // score(1~5)을 0~100 범위로 변환해 레이더 차트에 사용한다.
    const radarData = Array.isArray(feedbackData?.metrics)
        ? feedbackData.metrics.map((metric) => ({
            subject: metric.name,
            value: Math.min(100, Math.max(0, Math.round((metric.score / 5) * 100))),
        }))
        : [];
    // bad case일 때는 100%로 채워 긍정적 UI를 유지한다.
    const filledRadarData = radarData.length
        ? radarData.map((metric) => ({ ...metric, value: 100 }))
        : [];
    const strengthsText = badCaseFeedback
        ? '더 잘 할 수 있어요. 지금의 시도가 충분히 의미 있습니다.'
        : (feedbackData?.feedback?.strengths || '');
    const improvementsText = badCaseFeedback
        ? '조금만 더 자세히 설명해도 충분히 좋아질 수 있어요.'
        : (feedbackData?.feedback?.improvements || '');

    const renderFeedbackText = (text, className) => {
        const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
        return (
            <div className={`space-y-2 ${className}`}>
                {lines.map((line, idx) => {
                    const isBullet = line.startsWith('-');
                    const content = isBullet ? line.slice(1).trim() : line;
                    return (
                        <p
                            key={idx}
                            className={`leading-relaxed ${isBullet ? 'pl-4 relative' : ''}`}
                        >
                            {isBullet && <span className="absolute left-0">•</span>}
                            {content}
                        </p>
                    );
                })}
            </div>
        );
    };

    useEffect(() => {
        if (!badCaseFeedback) return;
    }, [badCaseFeedback]);

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                <AppHeader
                    title="AI 피드백"
                    onBack={() => navigate('/practice')}
                    showNotifications={false}
                    tone="dark"
                />

                <div className="text-center pb-6 px-6">
                    <div className="text-5xl mb-2">🎯</div>
                    <h2 className="text-2xl mb-1">분석 완료!</h2>
                    <p className="text-white/80 text-sm">답변을 꼼꼼히 분석했어요</p>
                </div>
            </div>

            <div className="p-6 max-w-lg mx-auto space-y-4 -mt-4">
                <>
                    <Card className="p-6 bg-white shadow-lg">
                        {!badCaseFeedback && (
                            <h3 className="mb-4 text-center">5각형 평가 지표</h3>
                        )}
                        {badCaseFeedback && (
                            <div className="text-center mb-4 space-y-2">
                                <p className="text-sm text-rose-900 font-medium">
                                    {badCaseFeedback.message}
                                </p>
                                <p className="text-xs text-rose-700">
                                    {badCaseFeedback.guidance}
                                </p>
                            </div>
                        )}

                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={badCaseFeedback ? filledRadarData : radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="평가" dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-5 border-2 border-rose-200 bg-rose-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                <ThumbsUp className="w-5 h-5 text-pink-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-rose-900">잘한 점</h3>
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
                                <h3 className="mb-2 text-pink-900">개선하면 좋은 점</h3>
                                {renderFeedbackText(improvementsText, 'text-sm text-pink-800')}
                            </div>
                        </div>
                    </Card>
                </>

                <div className="bg-gradient-to-r from-rose-100 to-pink-100 rounded-xl p-4">
                    <p className="text-sm text-rose-900 text-center">
                        <span className="font-semibold">💡 다음 목표:</span> 실제 프로젝트 경험과 연결하여 답변하면 더욱 인상적입니다!
                    </p>
                </div>

                <Button
                    onClick={() => navigate('/')}
                    className="w-full rounded-xl h-12 gap-2"
                    variant="default"
                >
                    <Home className="w-5 h-5" />
                    홈으로 이동
                </Button>
            </div>
        </div>
    );
};

export default PracticeResultAI;
