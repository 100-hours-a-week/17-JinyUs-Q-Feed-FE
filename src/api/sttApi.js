import { api, handleResponse } from '@/utils/apiUtils'

/**
 * STT 요청 - 음성 파일을 텍스트로 변환
 * @param {Object} params
 * @param {string} params.audioUrl - S3 음성 파일 URL
 * @param {string} params.questionId - 질문 ID
 * @returns {Promise<{data: {text: string}}>}
 */
export async function requestSTT({ audioUrl, questionId }) {
  const response = await api.post('/api/stt', {
    audioUrl,
    questionId,
  })
  return handleResponse(response)
}
