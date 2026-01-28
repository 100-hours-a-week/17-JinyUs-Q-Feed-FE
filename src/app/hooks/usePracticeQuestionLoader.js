import { useEffect, useMemo, useState } from 'react';
import { fetchQuestionById } from '@/api/questionApi';
import { usePracticeQuestion } from '@/app/contexts/practiceQuestionContext.jsx';
import { QUESTIONS } from '@/data/questions';

const TEXT_ERROR = '질문을 불러오지 못했습니다.';

export function usePracticeQuestionLoader(questionId) {
    const { selectedQuestion, setSelectedQuestion } = usePracticeQuestion();
    const [question, setQuestion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // Context에 동일 질문이 있는지 먼저 확인한다.
    const hasMatchedContextQuestion = useMemo(() => {
        return selectedQuestion && String(selectedQuestion.id) === String(questionId);
    }, [selectedQuestion, questionId]);

    // API 실패 대비 더미 데이터 fallback을 준비한다.
    const fallbackQuestion = useMemo(() => {
        const matched = QUESTIONS.find((q) => String(q.id) === String(questionId));
        if (matched) return matched;
        return QUESTIONS[0] || null;
    }, [questionId]);

    useEffect(() => {
        let isActive = true;

        const loadQuestion = async () => {
            if (!questionId) {
                setIsLoading(false);
                return;
            }

            if (hasMatchedContextQuestion) {
                setQuestion(selectedQuestion);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setErrorMessage('');

            try {
                const response = await fetchQuestionById(questionId);
                const data = response?.data ?? response ?? {};
                const mapped = {
                    id: data.questionId ?? data.id ?? questionId,
                    title: data.content ?? data.title ?? '',
                    description: data.content ?? '',
                    type: data.type ?? '',
                    category: data.category ?? '',
                    keywords: Array.isArray(data.keywords) ? data.keywords : [],
                };

                if (!isActive) return;
                if (!mapped.title) {
                    setQuestion(fallbackQuestion);
                    setErrorMessage(fallbackQuestion ? '' : TEXT_ERROR);
                    return;
                }
                setQuestion(mapped);
                setSelectedQuestion(mapped);
            } catch (error) {
                if (!isActive) return;
                if (fallbackQuestion) {
                    setQuestion(fallbackQuestion);
                    setErrorMessage('');
                } else {
                    setErrorMessage(error?.message || TEXT_ERROR);
                }
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        loadQuestion();
        return () => {
            isActive = false;
        };
    }, [
        questionId,
        hasMatchedContextQuestion,
        selectedQuestion,
        setSelectedQuestion,
        fallbackQuestion,
    ]);

    return {
        question,
        isLoading,
        errorMessage,
    };
}
