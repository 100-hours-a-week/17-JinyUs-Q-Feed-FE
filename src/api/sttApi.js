import { api, handleResponse } from '@/utils/apiUtils'

/**
 * STT 요청 - 음성 파일을 텍스트로 변환
 * @param {Object} params
 * @param {number} params.userId - 사용자 ID
 * @param {string|number} params.sessionId - 세션 ID (요청 시 string으로 직렬화)
 * @param {string} params.audioUrl - S3 음성 파일 URL (.mp3 또는 .m4a)
 * @returns {Promise<{data: {text: string}}>}
 */
export async function requestSTT({ userId, sessionId, audioUrl }) {
  const normalizedSessionId =
    sessionId === undefined || sessionId === null ? '' : String(sessionId).trim()

  const response = await api.post('/api/ai/stt', {
    user_id: userId,
    session_id: normalizedSessionId,
    audio_url: audioUrl,
  })
  return handleResponse(response)
}
