import { api, extractErrorMessage } from '@/utils/apiUtils'

const DEFAULT_TTS_ERROR_MESSAGE = '음성 변환에 실패했습니다.'
const TTS_PARSE_ERROR_MESSAGE = 'TTS 응답 파싱에 실패했습니다.'

function extractFileName(contentDisposition = '') {
  const quoted = contentDisposition.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) {
    return quoted[1]
  }

  const unquoted = contentDisposition.match(/filename=([^;]+)/i)
  if (!unquoted?.[1]) {
    return 'tts_output.mp3'
  }

  return unquoted[1].trim().replace(/^"|"$/g, '') || 'tts_output.mp3'
}

function toIntegerOrNull(value) {
  const number = Number(value)
  if (!Number.isInteger(number)) return null
  return number
}

/**
 * TTS 요청 - 텍스트를 음성(mp3)으로 변환
 * @param {Object} params
 * @param {number} params.userId - 사용자 ID
 * @param {string} params.sessionId - 면접 세션 ID
 * @param {string} params.text - 음성 변환 텍스트
 * @param {AbortSignal} [params.signal] - 요청 취소 시그널
 * @returns {Promise<{message: string, data: {user_id: number|null, session_id: string}, audioBlob: Blob, fileName: string}>}
 */
export async function requestTTS({ userId, sessionId, text, signal }) {
  const response = await api.post('/api/ai/tts', {
    user_id: userId,
    session_id: sessionId,
    text,
  }, { signal })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, DEFAULT_TTS_ERROR_MESSAGE))
  }

  const contentType = (response.headers.get('Content-Type') || '').toLowerCase()
  if (!contentType.startsWith('audio/')) {
    throw new Error(TTS_PARSE_ERROR_MESSAGE)
  }

  const audioBlob = await response.blob()
  if (!audioBlob || audioBlob.size <= 0) {
    throw new Error(TTS_PARSE_ERROR_MESSAGE)
  }

  const messageHeader = response.headers.get('X-TTS-Message')
  const userIdHeader = response.headers.get('X-TTS-User-Id')
  const sessionIdHeader = response.headers.get('X-TTS-Session-Id')
  const contentDisposition = response.headers.get('Content-Disposition') || ''

  return {
    message: messageHeader || 'get_audio_file_success',
    data: {
      user_id: toIntegerOrNull(userIdHeader) ?? toIntegerOrNull(userId),
      session_id: (sessionIdHeader || String(sessionId || '')).trim(),
    },
    audioBlob,
    fileName: extractFileName(contentDisposition),
  }
}
