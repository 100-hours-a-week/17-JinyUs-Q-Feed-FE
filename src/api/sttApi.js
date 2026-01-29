import { api, handleResponse } from '@/utils/apiUtils'

/**
 * STT 요청 - 음성 파일을 텍스트로 변환
 * @param {Object} params
 * @param {number} params.userId - 사용자 ID
 * @param {number} params.sessionId - 세션 ID
 * @param {string} params.audioUrl - S3 음성 파일 URL (.mp3 또는 .m4a)
 * @returns {Promise<{data: {text: string}}>}
 */
export async function requestSTT({ userId, sessionId, audioUrl }) {
  const response = await api.post('/ai/stt', {
    user_id: userId,
    session_id: sessionId,
    audio_url: audioUrl,
  })
  return handleResponse(response)
}
