import { useState } from 'react';
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
import { usePracticeAnswerSubmit } from '@/app/hooks/usePracticeAnswerSubmit';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';
const TEXT_SUBMIT_BUTTON = '답변 제출';
const TEXT_SUBMITTING = '제출 중...';
const TEXT_CONFIRM_TITLE = '답변을 제출하시겠습니까?';
const TEXT_CONFIRM_DESC = '제출된 답변은 AI가 분석하여 피드백을 제공합니다.';
const TEXT_PAGE_TITLE = '텍스트로 답변하기';
const TEXT_QUESTION_LABEL = '질문';
const TEXT_ANSWER_LABEL = '답변 작성';
const TEXT_ANSWER_PLACEHOLDER = '여기에 답변을 작성해주세요...';
const TEXT_CHARACTER_SUFFIX = '자';
const TEXT_CANCEL = '취소';
const TEXT_SUBMIT = '제출';
const PracticeAnswerText = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const [answer, setAnswer] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const { submitAnswer, isSubmitting } = usePracticeAnswerSubmit();
    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);

    const handleSubmit = () => {
        if (!answer.trim()) {
            return;
        }
        setShowConfirm(true);
    };

    const confirmSubmit = async () => {
        setShowConfirm(false);
        submitAnswer({
            questionId,
            question,
            answerText: answer,
            onAfterSubmit: (trimmedAnswer) => {
                navigate(`/practice/result-keyword/${questionId}`, {
                    state: {
                        answerText: trimmedAnswer,
                        retryPath: `/practice/answer-text/${questionId}`,
                    },
                });
            },
        });
    };

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <AppHeader
                title={TEXT_PAGE_TITLE}
                onBack={() => navigate(`/practice/answer/${questionId}`)}
                showNotifications={false}
            />

            <div className="p-6 max-w-lg mx-auto space-y-4">
                <Card className="p-4 bg-gray-50">
                    <p className="text-sm text-muted-foreground mb-1">{TEXT_QUESTION_LABEL}</p>
                    <p>{question.title}</p>
                </Card>

                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">{TEXT_ANSWER_LABEL}</p>
                    <Textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="h-[300px] overflow-y-auto text-base leading-relaxed"
                        placeholder={TEXT_ANSWER_PLACEHOLDER}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        {answer.length}{TEXT_CHARACTER_SUFFIX}
                    </p>
                </Card>

                <Button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className="w-full rounded-xl h-12"
                >
                    {isSubmitting ? TEXT_SUBMITTING : TEXT_SUBMIT_BUTTON}
                </Button>
            </div>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{TEXT_CONFIRM_TITLE}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {TEXT_CONFIRM_DESC}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{TEXT_CANCEL}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit}>{TEXT_SUBMIT}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PracticeAnswerText;
