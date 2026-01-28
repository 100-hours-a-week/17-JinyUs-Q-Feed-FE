import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
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
import { AppHeader } from '@/app/components/AppHeader';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';
import { requestInterviewFeedback } from '@/api/aiFeedbackApi';
import { toast } from 'sonner';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';
// TODO: 인증 연동 후 실제 사용자 ID로 교체
const DEFAULT_USER_ID = 1;
const INTERVIEW_TYPE = 'PRACTICE_INTERVIEW';
const FEEDBACK_STORAGE_PREFIX = 'qfeed_ai_feedback_';
const CATEGORY_CODE_MAP = {
    운영체제: 'OS',
    네트워크: 'NETWORK',
    데이터베이스: 'DB',
    '컴퓨터 구조': 'COMPUTER_ARCHITECTURE',
    자료구조: 'DATA_STRUCTURE',
    알고리즘: 'ALGORITHM',
};

const PracticeAnswerText = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const [answer, setAnswer] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);

    const questionType = useMemo(() => {
        if (question?.type) return question.type;
        if (question?.category === '시스템디자인') return 'SYSTEM_DESIGN';
        return 'CS';
    }, [question]);

    const categoryCode = useMemo(() => {
        if (!question?.category) return '';
        if (CATEGORY_CODE_MAP[question.category]) return CATEGORY_CODE_MAP[question.category];
        return question.category;
    }, [question]);

    const handleSubmit = () => {
        if (!answer.trim()) {
            return;
        }
        setShowConfirm(true);
    };

    const confirmSubmit = async () => {
        setShowConfirm(false);
        setIsSubmitting(true);

        const numericQuestionId = Number(question?.id ?? questionId);
        const storageKey = `${FEEDBACK_STORAGE_PREFIX}${questionId}`;

        // 분석 화면에서 폴링할 수 있도록 상태를 세션에 저장한다.
        sessionStorage.setItem(storageKey, JSON.stringify({ status: 'pending' }));

        requestInterviewFeedback({
            userId: DEFAULT_USER_ID,
            questionId: Number.isNaN(numericQuestionId) ? questionId : numericQuestionId,
            interviewType: INTERVIEW_TYPE,
            questionType,
            category: categoryCode,
            question: question?.title || '',
            answerText: answer.trim(),
        })
            .then((response) => {
                sessionStorage.setItem(
                    storageKey,
                    JSON.stringify({ status: 'done', response })
                );
            })
            .catch((err) => {
                sessionStorage.setItem(
                    storageKey,
                    JSON.stringify({ status: 'error', message: err?.message || '피드백 요청 실패' })
                );
                toast.error(err?.message || '피드백 요청에 실패했습니다');
            })
            .finally(() => {
                setIsSubmitting(false);
            });

        navigate(`/practice/result-keyword/${questionId}`, {
            state: { answerText: answer.trim() },
        });
    };

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title="텍스트로 답변하기"
                onBack={() => navigate(`/practice/answer/${questionId}`)}
                showNotifications={false}
            />

            <div className="p-6 max-w-lg mx-auto space-y-4">
                <Card className="p-4 bg-gray-50">
                    <p className="text-sm text-muted-foreground mb-1">질문</p>
                    <p>{question.title}</p>
                </Card>

                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">답변 작성</p>
                    <Textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="min-h-[300px] text-base leading-relaxed"
                        placeholder="여기에 답변을 작성해주세요..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        {answer.length}자
                    </p>
                </Card>

                <Button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className="w-full rounded-xl h-12"
                >
                    {isSubmitting ? '제출 중...' : '답변 제출'}
                </Button>
            </div>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>답변을 제출하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            제출된 답변은 AI가 분석하여 피드백을 제공합니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit}>제출</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PracticeAnswerText;
