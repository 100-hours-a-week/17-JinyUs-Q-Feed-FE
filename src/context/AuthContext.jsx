import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { setAccessTokenGetter } from '@/utils/apiUtils'
import { refreshTokens, logout as apiLogout } from '@/api/authApi'
import { queryClient } from '@/lib/queryClient'

const AuthContext = createContext(null)

const REFRESH_BUFFER_MS = 60 * 1000 // 만료 1분 전 갱신
const MIN_REFRESH_MS = 10 * 1000 // 최소 10초
const DEFAULT_NICKNAME = '사용자'

function decodeBase64UrlUtf8(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4 || 4)) % 4, '=')
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function parseTokenPayload(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    return JSON.parse(decodeBase64UrlUtf8(parts[1]))
  } catch {
    return null
  }
}

function getUserFromToken(token) {
  const payload = parseTokenPayload(token)
  const nickname = payload?.nickname
  return nickname ? { nickname } : null
}

function getTokenRefreshDelay(token) {
  const payload = parseTokenPayload(token)
  if (!payload?.exp) return null
  const expiresIn = payload.exp * 1000 - Date.now() - REFRESH_BUFFER_MS
  return Math.max(expiresIn, MIN_REFRESH_MS)
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const accessTokenRef = useRef(null)

  const isAuthenticated = !!accessToken

  const nickname = user?.nickname || user?.name || DEFAULT_NICKNAME

  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  useEffect(() => {
    setAccessTokenGetter(() => accessTokenRef.current)
  }, [])

  const refreshTimerRef = useRef(null)

  const scheduleRefresh = useCallback((token) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    const delay = getTokenRefreshDelay(token)
    if (delay == null) return

    refreshTimerRef.current = setTimeout(async () => {
      if (!accessTokenRef.current) return

      try {
        const newToken = await refreshTokens()
        setAccessToken(newToken)
        setUser(getUserFromToken(newToken))
        scheduleRefresh(newToken)
      } catch {
        setAccessToken(null)
        setUser(null)
      }
    }, delay)
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const newToken = await refreshTokens()
        setAccessToken(newToken)
        setUser(getUserFromToken(newToken))
        scheduleRefresh(newToken)
      } catch {
        if (!accessTokenRef.current) {
          setAccessToken(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  const login = useCallback((token, userData = null) => {
    accessTokenRef.current = token
    setAccessToken(token)
    const resolvedUser = userData ?? getUserFromToken(token)
    setUser(resolvedUser)
    scheduleRefresh(token)
  }, [scheduleRefresh])

  const logout = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    try {
      await apiLogout()
    } catch {
      // Ignore logout API errors
    } finally {
      setAccessToken(null)
      setUser(null)
      queryClient.clear()
    }
  }, [])

  const value = {
    accessToken,
    isAuthenticated,
    isLoading,
    user,
    nickname,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
