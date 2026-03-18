import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { setAccessTokenGetter, setUnauthorizedHandler } from '@/utils/apiUtils'
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
  const refreshTimerRef = useRef(null)
  // BroadcastChannel: 다른 탭으로 세션 무효화 신호 전파
  const authChannelRef = useRef(null)

  // 중복 실행 방지용 플래그: true면 세션이 무효화된 상태
  const isInvalidatingRef = useRef(false)
  // single-flight: 동시에 refresh 요청 1개만 허용
  const refreshInProgressRef = useRef(false)
  const refreshPromiseRef = useRef(null)

  const isAuthenticated = !!accessToken
  const nickname = user?.nickname || user?.name || DEFAULT_NICKNAME

  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  useEffect(() => {
    setAccessTokenGetter(() => accessTokenRef.current)
  }, [])

  // ─── 단일 세션 무효화 함수 ───────────────────────────────────────────────
  // 어디서 호출해도 한 번만 실행. 타이머·토큰·캐시를 모두 정리한다.
  // 완료 후 BroadcastChannel로 다른 탭에 전파 (송신 탭 자신에게는 발화 안 됨).
  const invalidateSession = useCallback((reason) => {
    if (isInvalidatingRef.current) return
    isInvalidatingRef.current = true

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    accessTokenRef.current = null
    setAccessToken(null)
    setUser(null)
    queryClient.clear()

    authChannelRef.current?.postMessage({ type: 'SESSION_INVALIDATED', reason })
  }, [])

  // ─── single-flight refresh ────────────────────────────────────────────────
  // 동시에 여러 컴포넌트가 refresh를 요청해도 실제 네트워크 요청은 1개만 발생
  const performRefresh = useCallback(() => {
    // 이미 세션이 무효화된 상태면 시도 자체를 차단
    if (isInvalidatingRef.current) {
      return Promise.reject(new Error('Session already invalidated'))
    }

    if (refreshInProgressRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    refreshInProgressRef.current = true
    const promise = refreshTokens().finally(() => {
      refreshInProgressRef.current = false
      refreshPromiseRef.current = null
    })
    refreshPromiseRef.current = promise
    return promise
  }, [])

  // ─── 다음 refresh 스케줄링 ────────────────────────────────────────────────
  const scheduleRefresh = useCallback(
    (token) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }

      const delay = getTokenRefreshDelay(token)
      if (delay == null) return

      refreshTimerRef.current = setTimeout(async () => {
        // 타이머가 발화될 시점에 이미 로그아웃/무효화 상태면 skip
        if (!accessTokenRef.current || isInvalidatingRef.current) return

        try {
          const newToken = await performRefresh()
          accessTokenRef.current = newToken
          setAccessToken(newToken)
          setUser(getUserFromToken(newToken))
          scheduleRefresh(newToken)
        } catch {
          // refresh 실패 = 세션 완전 무효화, 자동 재시도 없음 (fail-close)
          invalidateSession('scheduled_refresh_failed')
        }
      }, delay)
    },
    [performRefresh, invalidateSession],
  )

  // ─── 보호 API 401 → 세션 무효화 연결 ─────────────────────────────────────
  // authFetch에서 refresh/exchange/logout 외의 경로가 401을 받으면 호출됨
  useEffect(() => {
    setUnauthorizedHandler((reason) => {
      invalidateSession(reason)
    })
    return () => setUnauthorizedHandler(null)
  }, [invalidateSession])

  // ─── BroadcastChannel: 멀티탭 세션 동기화 ───────────────────────────────
  // 탭 A가 로그아웃/세션 만료 → SESSION_INVALIDATED 브로드캐스트
  // 탭 B, C가 수신 → 각자 invalidateSession 호출 → 모든 탭이 동시에 로그인 화면 전환
  // BroadcastChannel은 송신 탭 자신에게는 발화하지 않으므로 이중 호출 없음
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel('qfeed_auth')
    authChannelRef.current = channel

    channel.onmessage = (event) => {
      if (event.data?.type === 'SESSION_INVALIDATED') {
        invalidateSession(event.data.reason ?? 'cross_tab_invalidation')
      }
    }

    return () => {
      channel.close()
      authChannelRef.current = null
    }
  }, [invalidateSession])

  // ─── 앱 진입 시 인증 초기화 ───────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const newToken = await performRefresh()
        accessTokenRef.current = newToken
        setAccessToken(newToken)
        setUser(getUserFromToken(newToken))
        scheduleRefresh(newToken)
      } catch {
        // refresh 실패(만료/revoked/네트워크) → anonymous 상태 확정, 루프 없음
        invalidateSession('init_failed')
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

  // ─── 로그인 (OAuth 콜백 후 호출) ─────────────────────────────────────────
  const login = useCallback(
    (token, userData = null) => {
      // 이전 무효화 상태를 완전히 초기화한 뒤 새 세션 시작
      isInvalidatingRef.current = false
      refreshInProgressRef.current = false
      refreshPromiseRef.current = null

      accessTokenRef.current = token
      setAccessToken(token)
      setUser(userData ?? getUserFromToken(token))
      scheduleRefresh(token)
    },
    [scheduleRefresh],
  )

  // ─── 사용자 명시적 로그아웃 ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // 서버 로그아웃 실패해도 클라이언트 세션은 반드시 정리
    } finally {
      invalidateSession('logout')
    }
  }, [invalidateSession])

  const value = {
    accessToken,
    isAuthenticated,
    isLoading,
    user,
    nickname,
    login,
    logout,
    invalidateSession,
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
