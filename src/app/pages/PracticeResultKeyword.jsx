import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';
import { fetchAnswerFeedback } from '@/api/answerApi';
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
const TEXT_ANALYZING = 'AI가 답변을 분석중이에요...';
const TEXT_ERROR_FALLBACK = '피드백 요청에 실패했습니다.';
const TEXT_ERROR_PARSE = '피드백 결과를 불러오는 중 오류가 발생했습니다.';
const TEXT_BACK_MODAL_TITLE = 'AI가 답변 분석 중입니다.';
const TEXT_BACK_MODAL_DESC = '연습모드로 돌아가시겠습니까?';
const TEXT_BACK_MODAL_CONFIRM = '연습모드로 돌아가기';
const TEXT_BACK_MODAL_CANCEL = '닫기';
const TEXT_RESULT_BUTTON = 'AI 분석결과 보기';
const TEXT_PAGE_TITLE = '답변 분석';
const TEXT_QUESTION_LABEL = '질문';
const TEXT_MY_ANSWER_LABEL = '나의 답변';
const TEXT_KEYWORD_TITLE = '핵심 키워드';
const TEXT_KEYWORD_HELP = '답변에 이 키워드들이 포함되어 있는지 확인해보세요';
const TEXT_PROGRESS_SUFFIX = '%';
const FEEDBACK_STORAGE_PREFIX = 'qfeed_ai_feedback_';
const FEEDBACK_POLL_INTERVAL_MS = 800;
const FEEDBACK_STATUS_COMPLETED = 'COMPLETED';
const STORAGE_STATUS_PENDING = 'pending';
const STORAGE_STATUS_DONE = 'done';
const STORAGE_STATUS_ERROR = 'error';
const PROGRESS_WAIT_MAX = 95;
const PROGRESS_WAIT_STEP = 4;
const PROGRESS_WAIT_INTERVAL_MS = 450;
const PROGRESS_COMPLETE = 100;
const PROGRESS_COMPLETE_STEP = 1;
const PROGRESS_COMPLETE_INTERVAL_MS = 25;

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
                if (prev >= PROGRESS_WAIT_MAX) return PROGRESS_WAIT_MAX;
                return Math.min(PROGRESS_WAIT_MAX, prev + PROGRESS_WAIT_STEP);
            });
        }, PROGRESS_WAIT_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    // 세션에 저장된 피드백 상태를 폴링하여 완료 시 결과 화면으로 넘긴다.
    useEffect(() => {
        const storageKey = `${FEEDBACK_STORAGE_PREFIX}${questionId}`;
        let isFetching = false;
        let timer = null;
        const poll = () => {
            const raw = sessionStorage.getItem(storageKey);
            if (!raw) return;
            try {
                const data = JSON.parse(raw);
                if (data.status === STORAGE_STATUS_DONE) {
                    if (!feedbackResponse) {
                        setIsAnalyzing(false);
                        setFeedbackResponse(data.response);
                    }
                    sessionStorage.removeItem(storageKey);
                    if (timer) clearInterval(timer);
                    return;
                }
                if (data.status === STORAGE_STATUS_ERROR) {
                    setIsAnalyzing(false);
                    setFeedbackError(data.message || TEXT_ERROR_FALLBACK);
                    sessionStorage.removeItem(storageKey);
                    if (timer) clearInterval(timer);
                    return;
                }

                const answerId = data.answerId;
                if (!answerId || isFetching || feedbackResponse) return;

                isFetching = true;
                fetchAnswerFeedback(answerId)
                    .then((response) => {
                        const status = response?.data?.status;
                        if (status === FEEDBACK_STATUS_COMPLETED) {
                            setIsAnalyzing(false);
                            setFeedbackResponse(response);
                            sessionStorage.setItem(
                                storageKey,
                                JSON.stringify({ status: STORAGE_STATUS_DONE, answerId, response })
                            );
                            sessionStorage.removeItem(storageKey);
                            if (timer) clearInterval(timer);
                        }
                    })
                    .catch((err) => {
                        setIsAnalyzing(false);
                        setFeedbackError(err?.message || TEXT_ERROR_FALLBACK);
                        sessionStorage.removeItem(storageKey);
                        if (timer) clearInterval(timer);
                    })
                    .finally(() => {
                        isFetching = false;
                    });
            } catch {
                setIsAnalyzing(false);
                setFeedbackError(TEXT_ERROR_PARSE);
                if (timer) clearInterval(timer);
            }
        };

        timer = setInterval(poll, FEEDBACK_POLL_INTERVAL_MS);
        poll();
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [questionId, navigate, myAnswer, feedbackResponse]);

    // 응답 완료 후 95% → 100%를 부드럽게 채운다.
    useEffect(() => {
        if (!feedbackResponse) return;

        let current = PROGRESS_WAIT_MAX;
        const interval = setInterval(() => {
            current += PROGRESS_COMPLETE_STEP;
            setProgress(current);
            if (current >= PROGRESS_COMPLETE) {
                clearInterval(interval);
            }
        }, PROGRESS_COMPLETE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [feedbackResponse]);

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
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {myAnswer}
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-rose-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-pink-600" />
                        <h3>{TEXT_KEYWORD_TITLE}</h3>
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
                        {TEXT_KEYWORD_HELP}
                    </p>
                </Card>

                {isAnalyzing ? (
                    <Card className="p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <p className="mb-4">{TEXT_ANALYZING}</p>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {progress}{TEXT_PROGRESS_SUFFIX}
                            </p>
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
                        <AlertDialogAction onClick={() => navigate('/practice')}>
                            {TEXT_BACK_MODAL_CONFIRM}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PracticeResultKeyword;
