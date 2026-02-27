export const SESSION_STORAGE_KEYS = Object.freeze({
    SELECTED_PRACTICE_QUESTION: 'qfeed_selected_practice_question',
    PRACTICE_INTERVIEW_SESSION: 'qfeed_practice_interview_session',
    REAL_INTERVIEW_SESSION: 'qfeed_real_interview_session',
    PRACTICE_FEEDBACK_PREFIX: 'qfeed_ai_feedback_',
});

export const PRACTICE_FEEDBACK_UPDATED_EVENT = 'qfeed:practice-feedback-updated';

// 현재 로컬 스토리지 사용 키는 없지만, 저장소 키를 한 곳에서 관리하기 위한 엔트리입니다.
export const LOCAL_STORAGE_KEYS = Object.freeze({});

export function getPracticeFeedbackStorageKey(questionId) {
    return `${SESSION_STORAGE_KEYS.PRACTICE_FEEDBACK_PREFIX}${questionId}`;
}
