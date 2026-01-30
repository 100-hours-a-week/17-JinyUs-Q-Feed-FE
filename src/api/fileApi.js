import { api, handleResponse } from '@/utils/apiUtils'

// NOTE: 앱 서버로 가는 요청은 api(authFetch)를 사용한다.
// presigned URL 업로드는 외부(S3)로 직접 요청해야 하므로 fetch를 유지한다.

/**
 * S3 presigned URL 요청
 * @param {Object} params
 * @param {string} params.fileName - 파일명
 * @param {number} params.fileSize - 파일 크기 (bytes)
 * @param {string} params.mimeType - MIME 타입 (예: audio/webm)
 * @param {string} params.category - 파일 카테고리 (예: AUDIO)
 * @returns {Promise<{data: {fileId: string, presignedUrl: string}}>}
 */
export async function getPresignedUrl({ fileName, fileSize, mimeType, category }) {
  const response = await api.post('/api/files/presigned-url', {
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    category,
  })
  const result = await handleResponse(response)
  const data = result?.data ?? result ?? {}
  return {
    ...result,
    data: {
      ...data,
      fileId: data.fileId ?? data.file_id,
      presignedUrl: data.presignedUrl ?? data.presigned_url,
    },
  }
}

/**
 * S3 직접 업로드 (presigned URL 사용)
 * @param {string} presignedUrl - S3 presigned URL
 * @param {Blob} file - 업로드할 파일
 * @param {string} contentType - MIME 타입
 */
export async function uploadToS3(presignedUrl, file, contentType) {
  // presigned URL은 서명된 요청이므로 Authorization 헤더를 추가하면 실패한다.
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  })
  if (!response.ok) {
    throw new Error('S3 업로드 실패')
  }
}

/**
 * 파일 업로드 확인
 * @param {string} fileId - 파일 ID
 * @returns {Promise<{data: {fileUrl: string}}>}
 */
export async function confirmFileUpload(fileId) {
  const response = await api.post(`/api/files/${fileId}/confirm`)
  return handleResponse(response)
}
