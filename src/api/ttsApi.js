import { api, extractErrorMessage } from '@/utils/apiUtils'

const DEFAULT_TTS_ERROR_MESSAGE = '음성 변환에 실패했습니다.'
const TTS_PARSE_ERROR_MESSAGE = 'TTS 응답 파싱에 실패했습니다.'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function extractBoundary(contentType) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  return (match?.[1] || match?.[2] || '').trim()
}

function findSequence(source, target, startIndex = 0) {
  if (!target.length || source.length < target.length) {
    return -1
  }

  for (let i = startIndex; i <= source.length - target.length; i += 1) {
    let matched = true
    for (let j = 0; j < target.length; j += 1) {
      if (source[i + j] !== target[j]) {
        matched = false
        break
      }
    }
    if (matched) {
      return i
    }
  }

  return -1
}

function trimTrailingLineBreak(bytes) {
  let end = bytes.length

  if (end >= 2 && bytes[end - 2] === 13 && bytes[end - 1] === 10) {
    end -= 2
  } else if (end >= 1 && (bytes[end - 1] === 13 || bytes[end - 1] === 10)) {
    end -= 1
  }

  return bytes.slice(0, end)
}

function splitHeadersAndBody(partBytes) {
  const crlfDelimiter = new Uint8Array([13, 10, 13, 10])
  const lfDelimiter = new Uint8Array([10, 10])

  let headerEndIndex = findSequence(partBytes, crlfDelimiter)
  let bodyOffset = 4

  if (headerEndIndex === -1) {
    headerEndIndex = findSequence(partBytes, lfDelimiter)
    bodyOffset = 2
  }

  if (headerEndIndex === -1) {
    return null
  }

  return {
    headerBytes: partBytes.slice(0, headerEndIndex),
    bodyBytes: partBytes.slice(headerEndIndex + bodyOffset),
  }
}

function parseHeaders(headerBytes) {
  const lines = textDecoder.decode(headerBytes).split(/\r?\n/)
  const headers = {}

  for (const line of lines) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase()
    const value = line.slice(separatorIndex + 1).trim()

    if (key) {
      headers[key] = value
    }
  }

  return headers
}

function extractFileName(contentDisposition = '') {
  const quoted = contentDisposition.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) {
    return quoted[1]
  }

  const unquoted = contentDisposition.match(/filename=([^;]+)/i)
  if (!unquoted?.[1]) {
    return null
  }

  return unquoted[1].trim().replace(/^"|"$/g, '')
}

function parseMultipartMixed(bodyBytes, boundary) {
  const boundaryBytes = textEncoder.encode(`--${boundary}`)

  let cursor = 0
  let jsonPart = null
  let audioBytes = null
  let audioContentType = 'audio/mpeg'
  let fileName = 'tts_output.mp3'

  while (cursor < bodyBytes.length) {
    const boundaryIndex = findSequence(bodyBytes, boundaryBytes, cursor)
    if (boundaryIndex === -1) {
      break
    }

    let lineEndIndex = boundaryIndex + boundaryBytes.length

    const isClosingBoundary = bodyBytes[lineEndIndex] === 45 && bodyBytes[lineEndIndex + 1] === 45
    if (isClosingBoundary) {
      break
    }

    if (bodyBytes[lineEndIndex] === 13 && bodyBytes[lineEndIndex + 1] === 10) {
      lineEndIndex += 2
    } else if (bodyBytes[lineEndIndex] === 10) {
      lineEndIndex += 1
    }

    const nextBoundaryIndex = findSequence(bodyBytes, boundaryBytes, lineEndIndex)
    if (nextBoundaryIndex === -1) {
      break
    }

    const rawPartBytes = trimTrailingLineBreak(bodyBytes.slice(lineEndIndex, nextBoundaryIndex))
    const splitResult = splitHeadersAndBody(rawPartBytes)

    if (splitResult) {
      const headers = parseHeaders(splitResult.headerBytes)
      const contentType = (headers['content-type'] || '').toLowerCase()

      if (contentType.includes('application/json')) {
        jsonPart = JSON.parse(textDecoder.decode(splitResult.bodyBytes))
      }

      if (contentType.includes('audio/mpeg')) {
        audioBytes = splitResult.bodyBytes
        audioContentType = headers['content-type']?.split(';')[0].trim() || 'audio/mpeg'
        fileName = extractFileName(headers['content-disposition']) || fileName
      }
    }

    cursor = nextBoundaryIndex
  }

  if (!jsonPart || !audioBytes) {
    throw new Error(TTS_PARSE_ERROR_MESSAGE)
  }

  return {
    jsonPart,
    audioBlob: new Blob([audioBytes], { type: audioContentType }),
    fileName,
  }
}

/**
 * TTS 요청 - 텍스트를 음성(mp3)으로 변환
 * @param {Object} params
 * @param {number} params.userId - 사용자 ID
 * @param {string} params.sessionId - 면접 세션 ID
 * @param {string} params.text - 음성 변환 텍스트
 * @returns {Promise<{message: string, data: {user_id: number, session_id: string}, audioBlob: Blob, fileName: string}>}
 */
export async function requestTTS({ userId, sessionId, text }) {
  const response = await api.post('/api/ai/tts', {
    user_id: userId,
    session_id: sessionId,
    text,
  })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, DEFAULT_TTS_ERROR_MESSAGE))
  }

  const contentType = response.headers.get('Content-Type') || ''
  const boundary = extractBoundary(contentType)

  if (!boundary) {
    throw new Error(TTS_PARSE_ERROR_MESSAGE)
  }

  const bodyBytes = new Uint8Array(await response.arrayBuffer())
  const { jsonPart, audioBlob, fileName } = parseMultipartMixed(bodyBytes, boundary)

  return {
    ...jsonPart,
    audioBlob,
    fileName,
  }
}
