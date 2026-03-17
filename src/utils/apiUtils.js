const DEFAULT_ERROR_MESSAGE = '요청 처리에 실패했습니다.'

// 끝의 슬래시 제거 (base + '/api/...' 조합 시 // 가 되지 않도록)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

export async function parseJsonSafe(response) {
  const contentType = response.headers.get('Content-Type') || ''
  if (response.status === 204 || !contentType.includes('application/json')) {
    return null
  }
  return await response.json()
}

export async function extractErrorMessage(response, defaultMessage = DEFAULT_ERROR_MESSAGE) {
  const { message } = await extractErrorDetails(response, defaultMessage)
  return message
}

export async function extractErrorDetails(response, defaultMessage = DEFAULT_ERROR_MESSAGE) {
  try {
    const data = await parseJsonSafe(response)
    if (!data) {
      return {
        message: defaultMessage,
        code: null,
        data: null,
      }
    }
    if (typeof data === 'string') {
      return {
        message: data,
        code: null,
        data,
      }
    }
    return {
      message: data.message || data.error || data.errorMessage || defaultMessage,
      code: data.errorCode || data.code || null,
      data,
    }
  } catch {
    return {
      message: defaultMessage,
      code: null,
      data: null,
    }
  }
}

function createApiError(message, { code = null, status = null, data = null } = {}) {
  const error = new Error(message)
  error.name = 'ApiError'
  if (code) error.code = code
  if (status != null) error.status = status
  if (data != null) error.data = data
  return error
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
    const { message, code, data } = await extractErrorDetails(response, defaultErrorMessage)
    throw createApiError(message, {
      code,
      status: response.status,
      data,
    })
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

  const isFormData = fetchOptions.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
    authFetch(url, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (url, body, options = {}) =>
    authFetch(url, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (url, body, options = {}) =>
    authFetch(url, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (url, options = {}) => authFetch(url, { ...options, method: 'DELETE' }),
}

export { API_BASE_URL }
