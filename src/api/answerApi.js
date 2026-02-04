import { api, handleResponse } from '@/utils/apiUtils'

/**
 * 답변 목록 조회 API
 * @param {Object} params
 * @param {string} [params.type] - 답변 타입 (PRACTICE_INTERVIEW, REAL_INTERVIEW, PORTFOLIO)
 * @param {string} [params.category] - 질문 카테고리(OS, NETWORK, DB)
 * @param {string} [params.questionType] - 질문 타입(CS, SYSTEM_DESIGN)
 * @param {string} [params.dateFrom] - 시작 날짜
 * @param {string} [params.dateTo] - 종료 날짜
 * @param {number} [params.limit=10] - 페이지 크기 (1-50)
 * @param {string} [params.cursor] - Base64 인코딩된 커서
 * @param {AbortSignal} [params.signal] - AbortController signal
 * @returns {Promise<Object>} 답변 목록 및 페이지네이션 정보
 */
export async function fetchAnswers({
  type,
  category,
  questionType,
  dateFrom,
  dateTo,
  limit = 10,
  cursor,
  signal,
} = {}) {
  const queryParams = new URLSearchParams()

  if (type) queryParams.append('type', type)
  if (category) queryParams.append('category', category)
  if (questionType) queryParams.append('questionType', questionType)
  if (dateFrom) queryParams.append('dateFrom', dateFrom)
  if (dateTo) queryParams.append('dateTo', dateTo)
  if (limit) queryParams.append('limit', limit.toString())
  if (cursor) queryParams.append('cursor', cursor)

  const queryString = queryParams.toString()
  const url = `/api/answers${queryString ? `?${queryString}` : ''}`

  const response = await api.get(url, { signal })

  return handleResponse(response)
}

/**
 * 답변 상세 조회 API
 * @param {number|string} answerId - 답변 ID
 * @param {Object} [params]
 * @param {string|string[]} [params.expand] - 확장 필드
 * @param {AbortSignal} [params.signal] - AbortController signal
 * @returns {Promise<Object>} 답변 상세 정보
 */
export async function fetchAnswerDetail(
  answerId,
  { expand = ['question', 'feedback', 'immediate_feedback'], signal } = {}
) {
  const queryParams = new URLSearchParams()
  const expandValue = Array.isArray(expand) ? expand.join(',') : expand

  if (expandValue) queryParams.append('expand', expandValue)

  const queryString = queryParams.toString()
  const url = `/api/answers/${answerId}${queryString ? `?${queryString}` : ''}`

  const response = await api.get(url, { signal })
  return handleResponse(response)
}

/**
 * AI 피드백 조회
 * @param {number|string} answerId
 * @returns {Promise<Object>} 피드백 조회 결과
 */
export async function fetchAnswerFeedback(answerId) {
  const response = await api.get(`/api/interviews/answers/${answerId}/feedback`, {
    parseResponse: true,
  })
  return response
}

/**
 * 답변 제출 (연습/단일)
 * @param {Object} params
 * @param {number|string} params.questionId - 질문 ID
 * @param {string} params.answerText - 답변 내용 (max 1500)
 * @param {string} [params.answerType] - PRACTICE_INTERVIEW | REAL_INTERVIEW | PORTFOLIO_INTERVIEW
 * @returns {Promise<Object>} 답변 제출 결과
 */
export async function submitPracticeAnswer({ questionId, answerText, answerType }) {
  const formData = new FormData()
  formData.append('questionId', String(questionId))
  formData.append('answerText', answerText)
  if (answerType) formData.append('answerType', answerType)

  const response = await api.post('/api/interview/answers', formData, { parseResponse: true })
  return response
}
