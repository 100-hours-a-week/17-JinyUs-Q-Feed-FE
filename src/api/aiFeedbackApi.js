import { api } from '@/utils/apiUtils'

// AI 서버는 백엔드(8080)를 통해 호출한다.
/**
 * AI 피드백 요청 (백엔드 프록시)
 * @param {Object} params
 * @param {number} params.userId - 사용자 ID
 * @param {number} params.questionId - 질문 ID
 * @param {string} params.interviewType - PRACTICE_INTERVIEW | REAL_INTERVIEW
 * @param {string} params.questionType - CS | SYSTEM_DESIGN | PORTFOLIO
 * @param {string} [params.category] - 질문 카테고리 코드
 * @param {string} params.question - 질문 내용
 * @param {string} params.answerText - 답변 내용
 */
export async function requestInterviewFeedback({
  userId,
  questionId,
  interviewType,
  questionType,
  category,
  question,
  answerText,
}) {
  return api.post(
    '/ai/interview/feedback',
    {
      user_id: userId,
      question_id: questionId,
      interview_type: interviewType,
      question_type: questionType,
      category,
      question,
      answer_text: answerText,
    },
    { parseResponse: true }
  )
}
