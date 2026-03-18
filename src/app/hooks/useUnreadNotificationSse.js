import { useEffect, useLayoutEffect, useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const SSE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/notifications/unread`
const INITIAL_RETRY_MS = 1_000
const MAX_RETRY_MS = 30_000

class SseAuthError extends Error {}

/**
 * SSE 연결 관리 훅.
 * Bearer 토큰 헤더 필요 — native EventSource 불가, fetchEventSource 사용.
 *
 * @param {{ accessToken: string|null, onMessage: (hasUnread: boolean) => void, invalidateSession: (reason: string) => void }} params
 */
export function useUnreadNotificationSse({ accessToken, onMessage, invalidateSession }) {
  const onMessageRef = useRef(onMessage)
  const invalidateRef = useRef(invalidateSession)
  useLayoutEffect(() => {
    onMessageRef.current = onMessage
    invalidateRef.current = invalidateSession
  })
  const retryTimerRef = useRef(null)

  useEffect(() => {
    if (!accessToken) return

    let backoff = INITIAL_RETRY_MS
    let stopped = false
    const ctrl = new AbortController()

    function clearTimer() {
      if (retryTimerRef.current != null) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }

    async function connect() {
      clearTimer()
      try {
        await fetchEventSource(SSE_URL, {
          method: 'GET',
          // Bearer 헤더 필수 — SSE도 동일한 JWT 인증 사용
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/event-stream' },
          credentials: 'include',
          signal: ctrl.signal,
          openWhenHidden: true,

          async onopen(res) {
            if (res.status === 401) {
              stopped = true
              invalidateRef.current('sse_401') // 전역 auth 처리에 위임
              throw new SseAuthError()
            }
            if (!res.ok) throw new Error(`SSE_HTTP_${res.status}`)
            backoff = INITIAL_RETRY_MS // 연결 성공 시 backoff 초기화
          },

          onmessage(evt) {
            if (evt.event !== 'unread') return
            try {
              onMessageRef.current(evt.data === 'true')
            } catch {
              // 파싱 실패 시 무시 — 앱 크래시 방지
            }
          },

          onclose() {
            // 서버가 연결을 닫음 → retryable
            if (!stopped && !ctrl.signal.aborted) scheduleRetry()
          },

          onerror() {
            // fetchEventSource 내부 재시도 억제 — 직접 관리
            return false
          },
        })
      } catch (err) {
        if (stopped || ctrl.signal.aborted) return
        if (err instanceof SseAuthError) return // auth 실패, 재시도 없음
        scheduleRetry()
      }
    }

    function scheduleRetry() {
      const delay = backoff
      backoff = Math.min(backoff * 2, MAX_RETRY_MS)
      retryTimerRef.current = setTimeout(() => {
        if (!stopped && !ctrl.signal.aborted) connect()
      }, delay)
    }

    connect()

    return () => {
      stopped = true
      clearTimer()
      ctrl.abort()
    }
  }, [accessToken]) // accessToken 변경(토큰 갱신) 시 재연결 — 최신 토큰 사용
}
