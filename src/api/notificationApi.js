import { api, handleResponse } from '@/utils/apiUtils'

/**
 * 알림 목록 조회
 * @param {Object} params
 * @param {string|null} [params.cursor] - 커서
 * @param {number} [params.size=20] - 페이지 크기
 * @param {AbortSignal} [params.signal]
 */
export async function fetchNotifications({ cursor = null, size = 20, signal } = {}) {
  const queryParams = new URLSearchParams()
  if (cursor != null) queryParams.append('cursor', cursor)
  queryParams.append('size', String(size))

  const queryString = queryParams.toString()
  const url = `/api/notifications${queryString ? `?${queryString}` : ''}`

  const response = await api.get(url, { signal })
  return handleResponse(response)
}

/**
 * 알림 읽음 처리
 * @param {number|string} notificationId
 */
export async function markNotificationRead(notificationId) {
  const response = await api.patch(`/api/notifications/${notificationId}`, {})
  return handleResponse(response)
}

/**
 * 전체 알림 읽음 처리
 */
export async function markAllNotificationsRead() {
  const response = await api.patch('/api/notifications/read-all', {})
  return handleResponse(response)
}

/**
 * 알림 수신 설정 조회
 */
export async function fetchNotificationPreferences() {
  const response = await api.get('/api/notifications/preferences')
  return handleResponse(response)
}

/**
 * 알림 수신 설정 변경
 * @param {string} type - 알림 타입 (예: 'ANSWER_FEEDBACK', 'REVISIT')
 * @param {boolean} enabled
 */
export async function updateNotificationPreference(type, enabled) {
  const response = await api.put(`/api/notifications/preferences/${type}`, { enabled })
  return handleResponse(response)
}
