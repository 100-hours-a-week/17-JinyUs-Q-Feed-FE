import { createContext, useCallback, useContext, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useUnreadNotificationSse } from '@/app/hooks/useUnreadNotificationSse'

const UnreadNotificationContext = createContext(null)

export function UnreadNotificationProvider({ children }) {
  const { accessToken, isAuthenticated, invalidateSession } = useAuth()
  const [hasUnread, setHasUnread] = useState(false)

  // 안정적인 참조 — 빈 deps로 메모이제이션하여 SSE effect 불필요 재실행 방지
  const handleMessage = useCallback((value) => setHasUnread(value), [])

  useUnreadNotificationSse({
    accessToken: isAuthenticated ? accessToken : null, // 미인증 시 연결 안 함
    onMessage: handleMessage,
    invalidateSession,
  })

  // NotificationMain에서 모두 읽기 후 즉시 red dot 제거용
  const clearUnread = useCallback(() => setHasUnread(false), [])

  return (
    <UnreadNotificationContext.Provider value={{ hasUnread, clearUnread }}>
      {children}
    </UnreadNotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUnreadNotification() {
  const ctx = useContext(UnreadNotificationContext)
  if (!ctx) return { hasUnread: false, clearUnread: () => {} } // Provider 외부 안전 fallback
  return ctx
}
