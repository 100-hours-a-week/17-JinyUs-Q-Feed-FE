import { api } from '@/utils/apiUtils'
import { INTERVIEW_TYPES, QUESTION_TYPES } from '@/app/constants/interviewTaxonomy'

export { INTERVIEW_TYPES, QUESTION_TYPES }

const buildSessionQuery = (sessionId) => {
  const encoded = encodeURIComponent(String(sessionId))
  return `?sessionId=${encoded}`
}

/**
 * 인터뷰 세션 생성
 * @param {Object} params
 * @param {string} params.interviewType - PRACTICE_INTERVIEW | REAL_INTERVIEW
 * @param {string} params.questionType - CS | SYSTEM_DESIGN | PORTFOLIO
 */
export async function createInterviewSession({ interviewType, questionType }) {
  return api.post(
    '/api/interview/sessions',
    { interviewType, questionType },
    { parseResponse: true }
  )
}

/**
 * 연습 모드 답변 제출 (답변 기록만 수행)
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {number|string} params.questionId
 * @param {string} params.answerText
 */
export async function submitPracticeInterviewAnswer({ sessionId, questionId, answerText }) {
  return api.post(
    '/api/answers/practice',
    { sessionId, questionId, answerText },
    { parseResponse: true }
  )
}

/**
 * 실전 모드 답변 제출
 * @param {Object} params
 * @param {Object} [params.payload] - 서버 스키마를 그대로 전달할 요청 payload
 * @param {string} [params.sessionId]
 * @param {string} [params.answerText]
 * @param {number|string} [params.questionId]
 * @param {number} [params.userId]
 * @param {string} [params.questionType]
 * @param {Array<Object>} [params.interviewHistory]
 * @param {string} [params.turnType]
 * @param {number} [params.turnOrder]
 * @param {number} [params.topicId]
 * @param {string} [params.category]
 */
export async function submitRealInterviewAnswer(params = {}) {
  const {
    payload: rawPayload,
    sessionId,
    answerText,
    questionId,
    userId,
    questionType,
    interviewHistory,
    turnType,
    turnOrder,
    topicId,
    category,
  } = params

  if (rawPayload && typeof rawPayload === 'object') {
    return api.post('/api/answers/real', rawPayload, { parseResponse: true })
  }

  const payload = {}

  if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
    payload.sessionId = sessionId
  }
  if (answerText !== undefined && answerText !== null && answerText !== '') {
    payload.answerText = answerText
  }
  if (questionId !== undefined && questionId !== null && questionId !== '') {
    payload.questionId = questionId
  }

  // snake_case 스키마를 요구하는 실전모드 백엔드와의 호환 필드
  if (userId !== undefined && userId !== null) {
    payload.user_id = userId
  }
  if (questionType !== undefined && questionType !== null && questionType !== '') {
    payload.question_type = questionType
  }
  if (Array.isArray(interviewHistory)) {
    payload.interview_history = interviewHistory
  }
  if (turnType !== undefined && turnType !== null && turnType !== '') {
    payload.turn_type = turnType
  }
  if (typeof turnOrder === 'number' && Number.isInteger(turnOrder)) {
    payload.turn_order = turnOrder
  }
  if (topicId !== undefined && topicId !== null) {
    payload.topic_id = topicId
  }
  if (category !== undefined && category !== null && category !== '') {
    payload.category = category
  }

  return api.post('/api/answers/real', payload, { parseResponse: true })
}

/**
 * 세션 상태 조회
 * @param {string} sessionId
 */
export async function fetchInterviewSession(sessionId) {
  return api.get(`/api/interview/sessions${buildSessionQuery(sessionId)}`, { parseResponse: true })
}

/**
 * 세션 최종 피드백 조회(폴링)
 * @param {string} sessionId
 */
export async function fetchInterviewSessionFeedback(sessionId) {
  return api.get(`/api/interview/sessions/feedback${buildSessionQuery(sessionId)}`, { parseResponse: true })
}

/**
 * 세션 최종 피드백 요청
 * @param {Object} params
 * @param {string} params.sessionId
 */
export async function requestInterviewSessionFeedback({ sessionId }) {
  return api.post(
    '/api/interview/sessions/feedback/request',
    { sessionId },
    { parseResponse: true }
  )
}
