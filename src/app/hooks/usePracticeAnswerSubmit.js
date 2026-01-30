import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { submitPracticeAnswer } from '@/api/answerApi';

const TEXT_SUBMIT_ERROR = '피드백 요청에 실패했습니다';
const TEXT_FEEDBACK_REQUEST_FAILED = '피드백 요청 실패';
const INTERVIEW_TYPE = 'PRACTICE_INTERVIEW';
const FEEDBACK_STORAGE_PREFIX = 'qfeed_ai_feedback_';
const STORAGE_STATUS_PENDING = 'pending';
const STORAGE_STATUS_ERROR = 'error';

export const usePracticeAnswerSubmit = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitAnswer = useCallback(
        ({ questionId, question, answerText, onAfterSubmit }) => {
            const trimmedAnswer = answerText.trim();
            if (!trimmedAnswer || isSubmitting) return;

            setIsSubmitting(true);

            const numericQuestionId = Number(question?.id ?? questionId);
            const storageKey = `${FEEDBACK_STORAGE_PREFIX}${questionId}`;

            sessionStorage.setItem(
                storageKey,
                JSON.stringify({ status: STORAGE_STATUS_PENDING })
            );

            submitPracticeAnswer({
                questionId: Number.isNaN(numericQuestionId) ? questionId : numericQuestionId,
                answerText: trimmedAnswer,
                answerType: INTERVIEW_TYPE,
            })
                .then((response) => {
                    const answerId = response?.data?.answerId;
                    sessionStorage.setItem(
                        storageKey,
                        JSON.stringify({ status: STORAGE_STATUS_PENDING, answerId })
                    );
                })
                .catch((err) => {
                    sessionStorage.setItem(
                        storageKey,
                        JSON.stringify({
                            status: STORAGE_STATUS_ERROR,
                            message: err?.message || TEXT_FEEDBACK_REQUEST_FAILED,
                        })
                    );
                    toast.error(err?.message || TEXT_SUBMIT_ERROR);
                })
                .finally(() => {
                    setIsSubmitting(false);
                });

            if (onAfterSubmit) {
                onAfterSubmit(trimmedAnswer);
            }
        },
        [isSubmitting]
    );

    return { submitAnswer, isSubmitting };
};
