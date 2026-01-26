import { api, handleResponse } from '@/utils/apiUtils'

/**
 * 답변 목록 조회 API
 * @param {Object} params
 * @param {string} [params.type] - 답변 타입 (PRACTICE_INTERVIEW, REAL_INTERVIEW, PORTFOLIO_INTERVIEW)
 * @param {string} [params.category] - 질문 카테고리
 * @param {string} [params.dateFrom] - 시작 날짜
 * @param {string} [params.dateTo] - 종료 날짜
 * @param {number} [params.limit=10] - 페이지 크기 (1-50)
 * @param {string} [params.cursor] - Base64 인코딩된 커서
 * @param {string} [params.expand] - 확장 필드 (question, feedback)
 * @param {AbortSignal} [params.signal] - AbortController signal
 * @returns {Promise<Object>} 답변 목록 및 페이지네이션 정보
 */
export async function fetchAnswers({
  type,
  category,
  dateFrom,
  dateTo,
  limit = 10,
  cursor,
  expand,
  signal,
} = {}) {
  const queryParams = new URLSearchParams()

  if (type) queryParams.append('type', type)
  if (category) queryParams.append('category', category)
  if (dateFrom) queryParams.append('dateFrom', dateFrom)
  if (dateTo) queryParams.append('dateTo', dateTo)
  if (limit) queryParams.append('limit', limit.toString())
  if (cursor) queryParams.append('cursor', cursor)
  if (expand) queryParams.append('expand', expand)

  const queryString = queryParams.toString()
  const url = `/api/answers${queryString ? `?${queryString}` : ''}`

  const response = await api.get(url, { signal })

  return handleResponse(response)
}
