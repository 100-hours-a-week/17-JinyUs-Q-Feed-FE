import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';
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
const FEEDBACK_STORAGE_PREFIX = 'qfeed_ai_feedback_';
const FEEDBACK_POLL_INTERVAL_MS = 800;

const PracticeResultKeyword = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { state } = useLocation();
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showBackModal, setShowBackModal] = useState(false);
    const [feedbackResponse, setFeedbackResponse] = useState(null);
    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);
    const [feedbackError, setFeedbackError] = useState('');

    const myAnswer = state?.answerText || '';

    // 0~95%까지 천천히 올라가며 대기 상태를 표현한다.
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return 95;
                return Math.min(95, prev + 4);
            });
        }, 450);

        return () => clearInterval(interval);
    }, []);

    // 세션에 저장된 피드백 상태를 폴링하여 완료 시 결과 화면으로 넘긴다.
    useEffect(() => {
        if (progress !== 100 || !feedbackResponse) return;

        let current = 95;
        const interval = setInterval(() => {
            current += 1;
            setProgress(current);
            if (current >= 100) {
                clearInterval(interval);
            }
        }, 25);

        return () => clearInterval(interval);
    }, [feedbackResponse, progress]);

    useEffect(() => {
        const storageKey = `${FEEDBACK_STORAGE_PREFIX}${questionId}`;
        const poll = () => {
            const raw = sessionStorage.getItem(storageKey);
            if (!raw) return;
            try {
                const data = JSON.parse(raw);
                if (data.status === 'done') {
                    setIsAnalyzing(false);
                    setProgress(100);
                    setFeedbackResponse(data.response);
                } else if (data.status === 'error') {
                    setIsAnalyzing(false);
                    setFeedbackError(data.message || '피드백 요청에 실패했습니다.');
                }
            } catch (e) {
                setIsAnalyzing(false);
                setFeedbackError('피드백 결과를 불러오는 중 오류가 발생했습니다.');
            }
        };

        const timer = setInterval(poll, FEEDBACK_POLL_INTERVAL_MS);
        poll();
        return () => clearInterval(timer);
    }, [questionId, navigate, myAnswer]);

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    const handleBackClick = () => {
        if (isAnalyzing) {
            setShowBackModal(true);
        } else {
            navigate('/practice');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title="답변 분석"
                onBack={handleBackClick}
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
                ) : feedbackError ? (
                    <div className="text-center text-rose-500 text-sm py-4">
                        {feedbackError}
                    </div>
                ) : (
                    <Button
                        onClick={() => navigate(`/practice/result-ai/${questionId}`, {
                            state: { feedbackResponse, answerText: myAnswer },
                        })}
                        className="w-full rounded-xl h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                        disabled={!feedbackResponse}
                    >
                        AI 분석결과 보기
                    </Button>
                )}
            </div>

            <AlertDialog open={showBackModal} onOpenChange={setShowBackModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>AI가 답변 분석 중입니다.</AlertDialogTitle>
                        <AlertDialogDescription>
                            연습모드로 돌아가시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>닫기</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate('/practice')}>
                            연습모드로 돌아가기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PracticeResultKeyword;
