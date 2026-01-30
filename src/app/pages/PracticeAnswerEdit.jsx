import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { Edit3, Eye } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { toast } from 'sonner';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';
import { usePracticeAnswerSubmit } from '@/app/hooks/usePracticeAnswerSubmit';

const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';
const TEXT_SUBMITTING = '제출 중...';

const PracticeAnswerEdit = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { state } = useLocation();

    const [isEditing, setIsEditing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { submitAnswer, isSubmitting } = usePracticeAnswerSubmit();
    const [answer, setAnswer] = useState(state?.transcribedText);
    const { question, isLoading, errorMessage } = usePracticeQuestionLoader(questionId);

    const handleToggleEdit = () => {
        if (isEditing) {
            toast.success('편집이 완료되었습니다');
        } else {
            toast.info('답변을 수정할 수 있습니다');
        }
        setIsEditing(!isEditing);
    };

    const handleSubmit = () => {
        if (!answer.trim()) return;
        setShowConfirm(true);
    };

    const confirmSubmit = () => {
        setShowConfirm(false);
        submitAnswer({
            questionId,
            question,
            answerText: answer,
            onAfterSubmit: (trimmedAnswer) => {
                navigate(`/practice/result-keyword/${questionId}`, {
                    state: { answerText: trimmedAnswer },
                });
            },
        });
    };

    if (isLoading) return <div>{TEXT_LOADING}</div>;
    if (errorMessage) return <div>{errorMessage}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title="답변 확인"
                onBack={() => navigate(`/practice/answer/${questionId}`)}
                showNotifications={false}
                rightContent={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleEdit}
                        className="rounded-full gap-2"
                    >
                        {isEditing ? (
                            <>
                                <Eye className="w-4 h-4" />
                                완료
                            </>
                        ) : (
                            <>
                                <Edit3 className="w-4 h-4" />
                                편집
                            </>
                        )}
                    </Button>
                }
            />

            <div className="p-6 max-w-lg mx-auto space-y-4">
                <Card className="p-4 bg-gray-50">
                    <p className="text-sm text-muted-foreground mb-1">질문</p>
                    <p>{question.title}</p>
                </Card>

                <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">나의 답변</p>

                    {isEditing ? (
                        <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="min-h-[300px] text-base leading-relaxed"
                            placeholder="답변을 입력하세요..."
                        />
                    ) : (
                        <div className="text-base leading-relaxed whitespace-pre-wrap">
                            {answer}
                        </div>
                    )}
                </Card>

                <Button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className="w-full rounded-xl h-12"
                >
                    {isSubmitting ? TEXT_SUBMITTING : '답변 제출'}
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

export default PracticeAnswerEdit;
