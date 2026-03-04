import { api, handleResponse } from '@/utils/apiUtils'

/**
 * 알림 목록 조회
 * @param {Object} params
 * @param {string} [params.cursor] - 커서
 * @param {number} [params.limit=20] - 페이지 크기
 * @param {AbortSignal} [params.signal]
 */
export async function fetchNotifications({ cursor, limit = 20, signal } = {}) {
  const queryParams = new URLSearchParams()
  if (cursor) queryParams.append('cursor', cursor)
  if (limit) queryParams.append('limit', String(limit))

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
  const response = await api.patch(`/api/notifications/${notificationId}/read`, {})
  return handleResponse(response)
}

/**
 * 전체 알림 읽음 처리
 */
export async function markAllNotificationsRead() {
  const response = await api.patch('/api/notifications/read-all', {})
  return handleResponse(response)
}
