import { useCallback, useMemo, useState } from 'react';
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

const FEEDBACK_FORM_URL = 'https://forms.gle/nraq9VyYzQogYgFSA';
const TEXT_TITLE = 'Q-Feed v1.0.0 사용 후기 설문';
const TEXT_DESC = [
    'Q-Feed 사용해 주셔서 감사합니다! 🎙️',
    '베타 단계라 의견을 빠르게 반영하고 있어요.',
];
const TEXT_POINTS = [
    '👍 좋았던 점',
    '🛠️ 불편했던 점',
    '🌱 바라는 점',
];
const TEXT_FOOTER_LINES = [
    '총 5문항 · 약 1분.',
    '버튼을 누르면 새 창에서 구글폼이 열립니다.',
];
const TEXT_ACTION = '예, 피드백 남길래요';
const TEXT_CANCEL = '나중에 할게요';

export const useFeedbackFormDialog = () => {
    const [open, setOpen] = useState(false);

    const handleOpen = useCallback(() => {
        setOpen(true);
    }, []);

    const handleConfirm = useCallback(() => {
        window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer');
        setOpen(false);
    }, []);

    const dialog = useMemo(() => (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{TEXT_TITLE}</AlertDialogTitle>
                    <AlertDialogDescription asChild className="text-[13px] leading-snug">
                        <div className="space-y-2">
                            <div className="space-y-1">
                                {TEXT_DESC.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                            <ul className="space-y-1">
                                {TEXT_POINTS.map((point) => (
                                    <li key={point} className="leading-snug">
                                        {point}
                                    </li>
                                ))}
                            </ul>
                            <div className="space-y-1 text-muted-foreground">
                                {TEXT_FOOTER_LINES.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{TEXT_CANCEL}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>
                        {TEXT_ACTION}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    ), [open, handleConfirm]);

    return {
        open: handleOpen,
        dialog,
    };
};
