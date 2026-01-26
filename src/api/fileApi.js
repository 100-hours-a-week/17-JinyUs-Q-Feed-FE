import { api, handleResponse } from '@/utils/apiUtils'

/**
 * S3 presigned URL 요청
 * @param {Object} params
 * @param {string} params.fileName - 파일명
 * @param {string} params.contentType - MIME 타입 (예: audio/webm)
 * @returns {Promise<{data: {fileId: string, presignedUrl: string}}>}
 */
export async function getPresignedUrl({ fileName, contentType }) {
  const response = await api.post('/api/files/presigned-url', {
    fileName,
    contentType,
  })
  return handleResponse(response)
}

/**
 * S3 직접 업로드 (presigned URL 사용)
 * @param {string} presignedUrl - S3 presigned URL
 * @param {Blob} file - 업로드할 파일
 * @param {string} contentType - MIME 타입
 */
export async function uploadToS3(presignedUrl, file, contentType) {
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
