import { api } from './apiUtils';

// 빈 값 제외하고 쿼리 문자열을 생성한다.
const buildQuery = (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

// 질문 목록 조회
export async function fetchQuestions({ category, type, cursor, size } = {}) {
    const query = buildQuery({ category, type, cursor, size });
    return api.get(`/api/questions${query}`, { parseResponse: true });
}

// 질문 상세 조회
export async function fetchQuestionById(questionId) {
    return api.get(`/api/questions/${questionId}`, { parseResponse: true });
}

// 질문 검색
export async function searchQuestions({ q, category, type, cursor, size } = {}) {
    const query = buildQuery({ q, category, type, cursor, size });
    return api.get(`/api/questions/search${query}`, { parseResponse: true });
}

// 질문 생성
export async function createQuestion(payload) {
    return api.post('/api/questions', payload, { parseResponse: true });
}

// 질문 수정
export async function updateQuestion(questionId, payload) {
    return api.patch(`/api/questions/${questionId}`, payload, { parseResponse: true });
}

// 질문 삭제
export async function deleteQuestion(questionId) {
    return api.delete(`/api/questions/${questionId}`, { parseResponse: true });
}

// 질문 핵심 키워드 조회
export async function fetchQuestionKeywords(questionId) {
    return api.get(`/api/questions/${questionId}/keywords`, { parseResponse: true });
}

// 질문 핵심 키워드 포함 여부 확인
export async function checkQuestionKeywords(questionId, payload) {
    return api.post(`/api/questions/${questionId}/keyword-checks`, payload, { parseResponse: true });
}

// 시스템 디자인 질문 목록 조회
export async function fetchSystemDesignQuestions({ type, category, difficulty, page, size } = {}) {
    const query = buildQuery({ type, category, difficulty, page, size });
    return api.get(`/api/v1/questions/system-design${query}`, { parseResponse: true });
}

// 태그 목록 조회
export async function fetchTags() {
    return api.get('/api/tags', { parseResponse: true });
}

// 질문 태그 목록 조회
export async function fetchQuestionTags(questionId) {
    return api.get(`/api/questions/${questionId}/tags`, { parseResponse: true });
}
