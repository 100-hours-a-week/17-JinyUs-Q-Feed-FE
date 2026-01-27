import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Mic, Keyboard } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';

const PracticeAnswer = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const [cannotSpeak, setCannotSpeak] = useState(false);
    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);

    if (isLoading) {
        return <div>{TEXT_LOADING}</div>;
    }

    if (errorMessage) {
        return <div>{errorMessage}</div>;
    }

    if (!question) {
        return <div>{TEXT_NOT_FOUND}</div>;
    }

    const handleStart = () => {
        if (cannotSpeak) {
            navigate(`/practice/answer-text/${questionId}`);
        } else {
            navigate(`/practice/answer-voice/${questionId}`);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title="답변 준비"
                onBack={() => navigate('/practice')}
                showNotifications={false}
            />

            <div className="p-6 max-w-lg mx-auto space-y-6">
                <Card className="p-6 bg-gradient-to-br from-rose-50 to-white">
                    <h2 className="text-lg mb-4">{question.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        {question.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {question.keywords.map((keyword, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-3 py-1 bg-white text-rose-700 rounded-full border border-rose-200"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="mb-4">답변 방식 선택</h3>

                    <div className="space-y-3 mb-6">
                        <div className={`p-4 rounded-xl border-2 transition-all ${!cannotSpeak ? 'border-pink-500 bg-rose-50' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                                    <Mic className="w-6 h-6 text-pink-600" />
                                </div>
                                <div>
                                    <p className="font-medium">음성으로 답변하기</p>
                                    <p className="text-xs text-muted-foreground">실전처럼 말로 답변해보세요</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="cannot-speak"
                                checked={cannotSpeak}
                                onCheckedChange={(checked) => setCannotSpeak(checked)}
                                className="mt-1"
                            />
                            <label htmlFor="cannot-speak" className="text-sm text-muted-foreground cursor-pointer">
                                지금 말하기 힘들어요 (텍스트로 작성)
                            </label>
                        </div>
                    </div>

                    <Button onClick={handleStart} className="w-full rounded-xl h-12">
                        답변 시작
                    </Button>
                </Card>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">
                        <span className="font-semibold">💡 Tip:</span> 면접관에게 설명한다는 생각으로 답변해보세요. 키워드를 모두 포함하려고 노력해주세요.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PracticeAnswer;
