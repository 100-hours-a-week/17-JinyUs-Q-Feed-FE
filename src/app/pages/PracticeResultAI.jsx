import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { ThumbsUp, AlertCircle, Home } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';

const PracticeResultAI = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);

    const radarData = [
        { subject: '논리성', value: 85 },
        { subject: '완성도', value: 78 },
        { subject: '키워드', value: 90 },
        { subject: '명확성', value: 82 },
        { subject: '구조', value: 75 },
        { subject: '전달력', value: 88 },
    ];

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                <AppHeader
                    title="AI 피드백"
                    onBack={() => navigate(-1)}
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
                <Card className="p-6 bg-white shadow-lg">
                    <h3 className="mb-4 text-center">6각형 평가 지표</h3>

                    <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
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
                            <ul className="text-sm text-rose-800 space-y-1 list-disc list-inside">
                                <li>프로세스와 스레드의 핵심 개념을 명확히 설명했습니다</li>
                                <li>메모리 공유라는 중요한 차이점을 잘 짚어냈습니다</li>
                                <li>구조화된 답변으로 이해하기 쉽게 설명했습니다</li>
                            </ul>
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
                            <ul className="text-sm text-pink-800 space-y-1 list-disc list-inside">
                                <li>컨텍스트 스위칭에 대한 구체적인 설명을 추가하면 좋습니다</li>
                                <li>멀티프로세싱과 멀티스레딩의 실제 사용 사례를 언급해보세요</li>
                                <li>각 방식의 장단점을 좀 더 상세히 비교하면 완벽합니다</li>
                            </ul>
                        </div>
                    </div>
                </Card>

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
