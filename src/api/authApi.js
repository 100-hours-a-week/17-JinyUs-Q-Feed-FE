import { authFetch, extractErrorMessage, API_BASE_URL } from '@/utils/apiUtils.js'

export function getOAuthAuthorizationUrl(provider = 'kakao') {
  return `${API_BASE_URL}/api/auth/oauth/authorization-url?provider=${provider}`
}

export async function exchangeOAuthCode(exchangeCode) {
  const response = await authFetch('/api/auth/oauth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ exchangeCode }),
  })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, '로그인에 실패했습니다.'))
  }

  const authHeader = response.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('로그인에 실패했습니다.')
  }

  const data = await response.json().catch(() => null)
  const user = data?.data?.user ?? null

  return { accessToken: authHeader.slice(7), user }
}

export async function refreshTokens() {
  const response = await authFetch('/api/auth/tokens', {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, '토큰 갱신에 실패했습니다.'))
  }

  const authHeader = response.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('토큰 갱신에 실패했습니다.')
  }

  return authHeader.slice(7)
}

export async function logout() {
  const response = await authFetch('/api/auth/logout', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, '로그아웃에 실패했습니다.'))
  }

  return true
}

export async function logoutAll() {
  const response = await authFetch('/api/auth/logout/all', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, '전체 로그아웃에 실패했습니다.'))
  }

  return true
}
