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
import { QUESTIONS } from '@/data/questions';
import { ArrowLeft } from 'lucide-react';

const PracticeAnswerText = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const [answer, setAnswer] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const question = QUESTIONS.find((q) => q.id === questionId);

    const handleSubmit = () => {
        if (!answer.trim()) {
            return;
        }
        setShowConfirm(true);
    };

    const confirmSubmit = () => {
        setShowConfirm(false);
        navigate(`/practice/result-keyword/${questionId}`);
    };

    if (!question) return <div>질문을 찾을 수 없습니다</div>;

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="flex items-center gap-3 p-4 max-w-lg mx-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/practice/answer/${questionId}`)}
                        className="rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl">텍스트로 답변하기</h1>
                </div>
            </div>

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
                    disabled={!answer.trim()}
                    className="w-full rounded-xl h-12"
                >
                    답변 제출
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
