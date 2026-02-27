import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SESSION_STORAGE_KEYS } from '@/app/constants/storageKeys';

const STORAGE_KEY = SESSION_STORAGE_KEYS.SELECTED_PRACTICE_QUESTION;

const PracticeQuestionContext = createContext(null);

const loadInitialQuestion = () => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export function PracticeQuestionProvider({ children }) {
    const [selectedQuestion, setSelectedQuestionState] = useState(loadInitialQuestion);

    const setSelectedQuestion = useCallback((question) => {
        setSelectedQuestionState(question);
        try {
            if (question) {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(question));
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // sessionStorage 사용 불가 환경에서는 조용히 무시한다.
        }
    }, []);

    const clearSelectedQuestion = useCallback(() => {
        setSelectedQuestion(null);
    }, [setSelectedQuestion]);

    const value = useMemo(
        () => ({
            selectedQuestion,
            setSelectedQuestion,
            clearSelectedQuestion,
        }),
        [selectedQuestion, setSelectedQuestion, clearSelectedQuestion]
    );

    return <PracticeQuestionContext.Provider value={value}>{children}</PracticeQuestionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePracticeQuestion() {
    const context = useContext(PracticeQuestionContext);
    if (!context) {
        throw new Error('usePracticeQuestion must be used within PracticeQuestionProvider');
    }
    return context;
}
