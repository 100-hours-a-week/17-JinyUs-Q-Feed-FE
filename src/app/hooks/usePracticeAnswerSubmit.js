import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
    createInterviewSession,
    requestInterviewSessionFeedback,
    submitPracticeInterviewAnswer,
} from '@/api/interviewApi';
import {
    getPracticeFeedbackStorageKey,
    PRACTICE_FEEDBACK_UPDATED_EVENT,
    SESSION_STORAGE_KEYS,
} from '@/app/constants/storageKeys';
import {
    INTERVIEW_TYPES,
    QUESTION_TYPES,
    isSystemDesignCategoryKey,
} from '@/app/constants/interviewTaxonomy';

const TEXT_SUBMIT_ERROR = '피드백 요청에 실패했습니다';
const TEXT_FEEDBACK_REQUEST_FAILED = '피드백 요청 실패';
const TEXT_SESSION_CREATE_FAILED = '면접 세션 생성에 실패했습니다';
const TEXT_FEEDBACK_NOT_READY = '피드백 생성이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.';
const TEXT_ANSWER_TOO_SHORT = '답변이 너무 짧아요. 20자 이상 입력해주세요.';

const PRACTICE_SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS.PRACTICE_INTERVIEW_SESSION;
const SELECTED_QUESTION_STORAGE_KEY = SESSION_STORAGE_KEYS.SELECTED_PRACTICE_QUESTION;

const FEEDBACK_STATUS_COMPLETED = 'COMPLETED';
const FEEDBACK_STATUS_FAILED = 'FAILED';

const STORAGE_STATUS_PENDING = 'pending';
const STORAGE_STATUS_DONE = 'done';
const STORAGE_STATUS_ERROR = 'error';
/** AI 피드백 서비스에서 거부할 수 있는 너무 짧은 답변 방지 */
const MIN_ANSWER_LENGTH = 20;

const normalizeQuestionType = (value) => {
    if (typeof value !== 'string') return '';
    const normalized = value.trim().toUpperCase();
    return Object.values(QUESTION_TYPES).includes(normalized) ? normalized : '';
};

const inferQuestionTypeFromCategory = (value) => {
    return isSystemDesignCategoryKey(value)
        ? QUESTION_TYPES.SYSTEM_DESIGN
        : QUESTION_TYPES.CS;
};

const safeGetItem = (key) => {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeSetItem = (key, value) => {
    try {
        sessionStorage.setItem(key, value);
    } catch {
        // sessionStorage 사용 불가 환경에서는 무시
    }
};

const safeParseJson = (raw) => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const emitPracticeFeedbackUpdated = (storageKey) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent(PRACTICE_FEEDBACK_UPDATED_EVENT, {
            detail: { storageKey },
        })
    );
};

const writeFeedbackStorage = (storageKey, payload) => {
    safeSetItem(storageKey, JSON.stringify(payload));
    emitPracticeFeedbackUpdated(storageKey);
};

const resolveQuestionType = (question, questionId) => {
    const selectedQuestion = safeParseJson(safeGetItem(SELECTED_QUESTION_STORAGE_KEY));
    const hasMatchedSelectedQuestion =
        selectedQuestion && String(selectedQuestion.id) === String(questionId);

    const typeCandidates = [
        hasMatchedSelectedQuestion ? selectedQuestion?.type : null,
        hasMatchedSelectedQuestion ? selectedQuestion?.questionType : null,
        question?.type,
        question?.questionType,
    ];

    for (const candidate of typeCandidates) {
        const normalized = normalizeQuestionType(candidate);
        if (normalized) return normalized;
    }

    return inferQuestionTypeFromCategory(
        hasMatchedSelectedQuestion ? selectedQuestion?.category : question?.category
    );
};

const savePracticeSession = ({ sessionId, questionType, expiresAt }) => {
    safeSetItem(
        PRACTICE_SESSION_STORAGE_KEY,
        JSON.stringify({
            sessionId,
            interviewType: INTERVIEW_TYPES.PRACTICE,
            questionType,
            expiresAt: expiresAt || null,
            createdAt: new Date().toISOString(),
        })
    );
};

const hasFinalFeedbackPayload = (payload) => {
    return Boolean(
        Array.isArray(payload?.metrics) ||
        payload?.overall_feedback ||
        payload?.keyword_result ||
        payload?.bad_case_feedback
    );
};

const resolveFeedbackState = (response) => {
    const payload = response?.data;
    const status = payload?.status;

    if (status === FEEDBACK_STATUS_FAILED) {
        return {
            kind: STORAGE_STATUS_ERROR,
            message: payload?.message || TEXT_FEEDBACK_REQUEST_FAILED,
        };
    }

    if (status === FEEDBACK_STATUS_COMPLETED || (!status && hasFinalFeedbackPayload(payload))) {
        return {
            kind: STORAGE_STATUS_DONE,
            response,
        };
    }

    return {
        kind: STORAGE_STATUS_PENDING,
    };
};

export const usePracticeAnswerSubmit = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitAnswer = useCallback(
        async ({ questionId, question, answerText, onAfterSubmit }) => {
            const trimmedAnswer = answerText.trim();
            if (!trimmedAnswer || isSubmitting) return;
            if (trimmedAnswer.length < MIN_ANSWER_LENGTH) {
                toast.error(TEXT_ANSWER_TOO_SHORT);
                return;
            }

            setIsSubmitting(true);

            const numericQuestionId = Number(question?.id ?? questionId);
            const resolvedQuestionId = Number.isNaN(numericQuestionId) ? questionId : numericQuestionId;
            const storageKey = getPracticeFeedbackStorageKey(questionId);

            try {
                const questionType = resolveQuestionType(question, resolvedQuestionId);

                // 연습모드는 답변 제출마다 새 세션을 생성한다.
                const sessionResponse = await createInterviewSession({
                    interviewType: INTERVIEW_TYPES.PRACTICE,
                    questionType,
                });

                const sessionId = sessionResponse?.data?.session_id ?? sessionResponse?.data?.sessionId;
                if (!sessionId) {
                    throw new Error(TEXT_SESSION_CREATE_FAILED);
                }

                savePracticeSession({
                    sessionId,
                    questionType,
                    expiresAt: sessionResponse?.data?.expires_at ?? sessionResponse?.data?.expiresAt,
                });

                const createdAt = new Date().toISOString();
                writeFeedbackStorage(storageKey, {
                    status: STORAGE_STATUS_PENDING,
                    sessionId,
                    createdAt,
                });

                if (onAfterSubmit) {
                    onAfterSubmit(trimmedAnswer);
                }

                // 결과 화면에서 프로그래스를 보여줄 수 있도록 제출/요청은 백그라운드로 진행한다.
                void (async () => {
                    try {
                        await submitPracticeInterviewAnswer({
                            sessionId,
                            questionId: resolvedQuestionId,
                            answerText: trimmedAnswer,
                        });

                        const requestedAt = new Date().toISOString();
                        writeFeedbackStorage(storageKey, {
                            status: STORAGE_STATUS_PENDING,
                            sessionId,
                            createdAt,
                            requestedAt,
                        });

                        const requestResponse = await requestInterviewSessionFeedback({ sessionId });
                        const resolved = resolveFeedbackState(requestResponse);

                        if (resolved.kind === STORAGE_STATUS_DONE) {
                            writeFeedbackStorage(storageKey, {
                                status: STORAGE_STATUS_DONE,
                                sessionId,
                                response: resolved.response,
                            });
                            return;
                        }

                        if (resolved.kind === STORAGE_STATUS_ERROR) {
                            writeFeedbackStorage(storageKey, {
                                status: STORAGE_STATUS_ERROR,
                                message: resolved.message,
                            });
                            return;
                        }

                        writeFeedbackStorage(storageKey, {
                            status: STORAGE_STATUS_ERROR,
                            message: TEXT_FEEDBACK_NOT_READY,
                        });
                    } catch (err) {
                        writeFeedbackStorage(storageKey, {
                            status: STORAGE_STATUS_ERROR,
                            message: err?.message || TEXT_FEEDBACK_REQUEST_FAILED,
                        });
                    }
                })();
            } catch (err) {
                writeFeedbackStorage(storageKey, {
                    status: STORAGE_STATUS_ERROR,
                    message: err?.message || TEXT_FEEDBACK_REQUEST_FAILED,
                });
                toast.error(err?.message || TEXT_SUBMIT_ERROR);
            } finally {
                setIsSubmitting(false);
            }
        },
        [isSubmitting]
    );

    return { submitAnswer, isSubmitting };
};
