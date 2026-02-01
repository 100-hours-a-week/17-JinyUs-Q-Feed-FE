import {api, handleResponse} from '@/utils/apiUtils.js'

export async function deleteAccount() {
  const response = await api.delete('/api/users/me')

  return handleResponse(response, '/profile', '계정 삭제에 실패했습니다.')
}

export async function fetchUserStats() {
    const response = await api.get('/api/users/me/stats')
    return handleResponse(response, '/profile')
}

export async function fetchWeeklyStats() {
    const response = await api.get('/api/users/me/stats/weekly')
    return handleResponse(response, '/')
}
