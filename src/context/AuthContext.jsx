import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { setAccessTokenGetter } from '@/utils/apiUtils'
import { refreshTokens, logout as apiLogout } from '@/api/authApi'
import { storage } from '@/utils/storage'

const AuthContext = createContext(null)

const TOKEN_REFRESH_INTERVAL = 9 * 60 * 1000 // 9 minutes (before 10min expiry)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const accessTokenRef = useRef(null)

  const isAuthenticated = !!accessToken

  // Keep ref in sync with state
  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  // Provide access token getter to apiUtils
  useEffect(() => {
    setAccessTokenGetter(() => accessTokenRef.current)
  }, [])

  // Try to refresh token on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const newToken = await refreshTokens()
        setAccessToken(newToken)
        storage.setLoggedIn(true)
      } catch {
        if (!accessTokenRef.current) {
          setAccessToken(null)
          storage.setLoggedIn(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Stable token refresh interval (does not re-create on token change)
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      if (!accessTokenRef.current) return

      try {
        const newToken = await refreshTokens()
        setAccessToken(newToken)
      } catch {
        setAccessToken(null)
        storage.setLoggedIn(false)
      }
    }, TOKEN_REFRESH_INTERVAL)

    return () => clearInterval(refreshInterval)
  }, [])

  const login = useCallback((token, userData = null) => {
    accessTokenRef.current = token
    setAccessToken(token)
    if (userData) {
      setUser(userData)
      storage.setNickname(userData.nickname || userData.name || '사용자')
    }
    storage.setLoggedIn(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Ignore logout API errors
    } finally {
      setAccessToken(null)
      setUser(null)
      storage.clear()
    }
  }, [])

  const value = {
    accessToken,
    isAuthenticated,
    isLoading,
    user,
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
