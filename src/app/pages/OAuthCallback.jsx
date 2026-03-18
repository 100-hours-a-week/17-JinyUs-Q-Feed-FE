import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { exchangeOAuthCode } from '@/api/authApi'
import { toast } from 'sonner'

const OAuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, invalidateSession } = useAuth()
  const [error, setError] = useState(null)
  const processed = useRef(false)
  // 언마운트 시 setTimeout 누수 방지
  const redirectTimerRef = useRef(null)

  // 에러 발생 시 2초 후 /login으로 이동. 언마운트되면 타이머를 정리해 stale navigation 방지.
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const scheduleLoginRedirect = () => {
      redirectTimerRef.current = setTimeout(() => navigate('/login', { replace: true }), 2000)
    }

    const handleCallback = async () => {
      const exchangeCode = searchParams.get('exchange_code')
      const errorParam = searchParams.get('error')
      const errorMessage = searchParams.get('error_message')

      if (errorParam) {
        const msg = errorMessage || '로그인에 실패했습니다.'
        invalidateSession('oauth_error_param')
        setError(msg)
        toast.error(msg)
        scheduleLoginRedirect()
        return
      }

      if (exchangeCode) {
        try {
          const result = await exchangeOAuthCode(exchangeCode)
          login(result.accessToken, result.user)
          toast.success('로그인 성공!')
          navigate('/', { replace: true })
        } catch {
          invalidateSession('oauth_exchange_failed')
          setError('인증 처리에 실패했습니다.')
          toast.error('인증 처리에 실패했습니다.')
          scheduleLoginRedirect()
        }
        return
      }

      // exchange_code 없이 도달한 경우 → 잘못된 접근, 깨끗한 상태로 재로그인 유도
      invalidateSession('oauth_no_exchange_code')
      setError('인증 정보를 찾을 수 없습니다.')
      toast.error('인증 정보를 찾을 수 없습니다.')
      scheduleLoginRedirect()
    }

    handleCallback()
  }, [searchParams, login, invalidateSession, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-red-600">{error}</p>
            <p className="text-muted-foreground text-sm mt-2">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center animate-pulse">
              <span className="text-2xl">Q</span>
            </div>
            <p className="text-muted-foreground">로그인 처리 중...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default OAuthCallback