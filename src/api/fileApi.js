import { api, handleResponse } from '@/utils/apiUtils'

// NOTE: 앱 서버로 가는 요청은 api(authFetch)를 사용한다.
// presigned URL 업로드는 외부(S3)로 직접 요청해야 하므로 fetch를 유지한다.

/**
 * S3 presigned URL 요청
 * @param {Object} params
 * @param {string} [params.fileName] - 파일명(서버에서 키 생성 시 무시될 수 있음)
 * @param {number} params.fileSize - 파일 크기 (bytes)
 * @param {string} params.mimeType - MIME 타입 (예: audio/webm)
 * @param {string} params.category - 파일 카테고리 (예: AUDIO)
 * @param {string} [params.method='PUT'] - 업로드 HTTP 메서드
 * @returns {Promise<{data: {fileId: string, presignedUrl: string}}>}
 */
export async function getPresignedUrl({
  fileName,
  fileSize,
  mimeType,
  category,
  method = 'PUT',
}) {
  const payload = {
    method,
    file_size: fileSize,
    mime_type: mimeType,
    category,
  }

  if (fileName) payload.file_name = fileName

  const response = await api.post('/api/files/presigned-url', payload)
  const result = await handleResponse(response)
  const data = result?.data ?? result ?? {}
  return {
    ...result,
    data: {
      ...data,
      fileId: data.fileId ?? data.file_id,
      presignedUrl: data.presignedUrl ?? data.presigned_url,
      uploadMode: data.uploadMode ?? data.upload_mode,
      partSize: data.partSize ?? data.part_size,
    },
  }
}

/**
 * VIDEO multipart 파트 업로드 URL 발급
 * @param {string|number} fileId
 * @param {number} partNumber
 * @returns {Promise<{data: {partNumber: number, presignedUrl: string}}>}
 */
export async function getMultipartPartPresignedUrl(fileId, partNumber) {
  const response = await api.post(`/api/files/${fileId}/multipart/parts`, {
    part_number: partNumber,
  })
  const result = await handleResponse(response)
  const data = result?.data ?? result ?? {}

  return {
    ...result,
    data: {
      ...data,
      partNumber: data.partNumber ?? data.part_number,
      presignedUrl: data.presignedUrl ?? data.presigned_url,
    },
  }
}

/**
 * VIDEO multipart 완료 처리
 * @param {string|number} fileId
 * @param {Object} params
 * @param {Array<{part_number:number,etag:string}>} params.parts
 */
export async function completeMultipartUpload(fileId, { parts } = {}) {
  const payload = {
    parts,
  }

  const response = await api.post(`/api/files/${fileId}/multipart/complete`, payload)
  const result = await handleResponse(response)
  const data = result?.data ?? result ?? {}

  return {
    ...result,
    data: {
      ...data,
      fileId: data.fileId ?? data.file_id,
    },
  }
}

/**
 * VIDEO multipart 업로드 중단
 * @param {string|number} fileId
 */
export async function abortMultipartUpload(fileId) {
  const response = await api.post(`/api/files/${fileId}/multipart/abort`)
  return handleResponse(response)
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
 * S3 multipart part 업로드
 * @param {string} presignedUrl
 * @param {Blob} partBlob
 * @returns {Promise<string>} ETag
 */
export async function uploadPartToS3(presignedUrl, partBlob) {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: partBlob,
  })

  if (!response.ok) {
    throw new Error('S3 멀티파트 업로드 실패')
  }

  const etag = response.headers.get('ETag') || response.headers.get('etag')
  const normalized = typeof etag === 'string' ? etag.trim() : ''
  if (!normalized) {
    throw new Error('멀티파트 ETag를 확인할 수 없습니다.')
  }
  return normalized
}

/**
 * 기존 업로드 파일 조회용 GET presigned URL 발급
 * @param {string|number} fileId
 * @returns {Promise<{data: {fileId: string|number, presignedUrl: string, method: string}}>}
 */
export async function getFileReadPresignedUrl(fileId) {
  const response = await api.post('/api/files/presigned-url', {
    file_id: fileId,
    method: 'GET',
  })
  const result = await handleResponse(response)
  const data = result?.data ?? result ?? {}

  return {
    ...result,
    data: {
      ...data,
      fileId: data.fileId ?? data.file_id,
      presignedUrl: data.presignedUrl ?? data.presigned_url,
      method: data.method ?? 'GET',
    },
  }
}

/**
 * S3 URL로 리소스를 조회해 Blob으로 반환
 * @param {string} resourceUrl
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Blob>}
 */
export async function fetchS3ResourceBlob(resourceUrl, { signal } = {}) {
  const response = await fetch(resourceUrl, {
    method: 'GET',
    signal,
  })

  if (!response.ok) {
    throw new Error('S3 리소스 조회 실패')
  }

  return response.blob()
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
