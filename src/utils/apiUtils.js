const DEFAULT_ERROR_MESSAGE = '요청 처리에 실패했습니다.'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function parseJsonSafe(response) {
  const contentType = response.headers.get('Content-Type') || ''
  if (response.status === 204 || !contentType.includes('application/json')) {
    return null
  }
  return await response.json()
}

export async function extractErrorMessage(response, defaultMessage = DEFAULT_ERROR_MESSAGE) {
  try {
    const data = await parseJsonSafe(response)
    if (!data) return defaultMessage
    if (typeof data === 'string') return data
    if (data.message) return data.message
    if (data.error) return data.error
    if (data.errorMessage) return data.errorMessage
    return defaultMessage
  } catch (e) {
    return defaultMessage
  }
}

export async function handleResponse(response, fallbackRedirect, defaultErrorMessage = DEFAULT_ERROR_MESSAGE) {
  const redirectUrl =
    response.redirected || (response.status >= 300 && response.status < 400)
      ? response.headers.get('Location') || response.url || fallbackRedirect
      : null

  if (redirectUrl) {
    return { redirectUrl }
  }

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, defaultErrorMessage))
  }

  return await parseJsonSafe(response)
}

let accessTokenGetter = null

export function setAccessTokenGetter(getter) {
  accessTokenGetter = getter
}

export async function authFetch(url, options = {}) {
  const { parseResponse = false, signal, ...fetchOptions } = options
  const accessToken = accessTokenGetter?.()

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers,
    credentials: 'include',
    ...(signal && { signal }),
  })

  if (parseResponse) {
    return handleResponse(response)
  }

  return response
}

export const api = {
  get: (url, options = {}) => authFetch(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) =>
    authFetch(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options = {}) =>
    authFetch(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body, options = {}) =>
    authFetch(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options = {}) => authFetch(url, { ...options, method: 'DELETE' }),
}

export { API_BASE_URL }
