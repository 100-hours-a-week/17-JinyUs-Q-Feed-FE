import { authFetch, extractErrorMessage } from '@/utils/apiUtils.js'

export async function deleteAccount() {
  const response = await authFetch('/api/users/me', {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, '계정 삭제에 실패했습니다.'))
  }

  return true
}
