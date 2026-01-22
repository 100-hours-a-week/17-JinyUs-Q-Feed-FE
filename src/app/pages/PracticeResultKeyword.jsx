import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { QUESTIONS } from '@/data/questions';
import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';

const PracticeResultKeyword = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);

    const question = QUESTIONS.find((q) => q.id === questionId);
    const myAnswer = '프로세스는 실행 중인 프로그램의 인스턴스로, 독립적인 메모리 공간을 가지고 있습니다. 반면 스레드는 프로세스 내에서 실행되는 작업의 단위로, 같은 프로세스의 다른 스레드와 메모리를 공유합니다.';

    useEffect(() => {
        // Simulate analysis
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    setIsAnalyzing(false);
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);

        return () => clearInterval(interval);
    }, []);

    if (!question) return <div>질문을 찾을 수 없습니다</div>;

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title="답변 분석"
                onBack={() => navigate('/practice')}
                showNotifications={false}
            />

            <div className="p-6 max-w-lg mx-auto space-y-4">
                <Card className="p-4 bg-gray-50">
                    <p className="text-sm text-muted-foreground mb-1">질문</p>
                    <p>{question.title}</p>
                </Card>

                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">나의 답변</p>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {myAnswer}
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-rose-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-pink-600" />
                        <h3>핵심 키워드</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {question.keywords.map((keyword, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-rose-100 text-rose-700 px-3 py-1"
                            >
                                #{keyword}
                            </Badge>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                        답변에 이 키워드들이 포함되어 있는지 확인해보세요
                    </p>
                </Card>

                {isAnalyzing ? (
                    <Card className="p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <p className="mb-4">AI가 답변을 분석중이에요...</p>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
                        </div>
                    </Card>
                ) : (
                    <Button
                        onClick={() => navigate(`/practice/result-ai/${questionId}`)}
                        className="w-full rounded-xl h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    >
                        AI 분석결과 보기
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PracticeResultKeyword;
