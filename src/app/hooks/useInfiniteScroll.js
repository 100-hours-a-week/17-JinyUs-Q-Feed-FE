import { useState, useEffect, useRef, useCallback } from 'react'
import throttle from 'lodash/throttle'

const THROTTLE_DELAY_MS = 300

/**
 * 무한 스크롤 커스텀 훅
 * @param {Function} fetchFn - 데이터를 가져오는 함수 (cursor, signal을 받아 Promise 반환)
 * @param {Object} options
 * @param {number} [options.limit=10] - 페이지당 항목 수
 * @param {boolean} [options.enabled=true] - 훅 활성화 여부
 * @returns {Object} { data, loading, error, hasMore, observerRef, reset }
 */
export function useInfiniteScroll(fetchFn, { limit = 10, enabled = true } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  const cursorRef = useRef(null)
  const pendingRequestController = useRef(null)
  const observerRef = useRef(null)
  const isInitialMount = useRef(true)

  const cancelPendingRequest = useCallback(() => {
    if (pendingRequestController.current) {
      pendingRequestController.current.abort()
      pendingRequestController.current = null
    }
  }, [])

  const isAbortError = useCallback((err) => {
    return err.name === 'AbortError' || err.message === 'The user aborted a request.'
  }, [])

  const fetchNextPage = useCallback(async () => {
    if (!enabled || loading || !hasMore) return

    cancelPendingRequest()
    pendingRequestController.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const response = await fetchFn({
        cursor: cursorRef.current,
        limit,
        signal: pendingRequestController.current.signal,
      })

      const { records = [], pagination = {} } = response.data || response || {}

      setData((prev) => [...prev, ...records])
      cursorRef.current = pagination.nextCursor || null
      setHasMore(pagination.hasNext ?? false)
    } catch (err) {
      if (isAbortError(err)) {
        return
      }
      setError(err)
    } finally {
      setLoading(false)
      pendingRequestController.current = null
    }
  }, [enabled, loading, hasMore, fetchFn, limit, cancelPendingRequest, isAbortError])

  // Throttle된 fetchNextPage
  const throttledFetchNextPage = useRef(
    throttle(() => {
      fetchNextPage()
    }, THROTTLE_DELAY_MS, { leading: true, trailing: false })
  )

  useEffect(() => {
    throttledFetchNextPage.current = throttle(() => {
      fetchNextPage()
    }, THROTTLE_DELAY_MS, { leading: true, trailing: false })

    return () => {
      throttledFetchNextPage.current.cancel()
    }
  }, [fetchNextPage])

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          throttledFetchNextPage.current()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    )

    const currentObserverRef = observerRef.current

    if (currentObserverRef) {
      observer.observe(currentObserverRef)
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef)
      }
      observer.disconnect()
    }
  }, [enabled, hasMore, loading])

  useEffect(() => {
    if (isInitialMount.current && enabled) {
      isInitialMount.current = false
      fetchNextPage()
    }
  }, [enabled, fetchNextPage])

  useEffect(() => {
    return () => {
      cancelPendingRequest()
      throttledFetchNextPage.current.cancel()
    }
  }, [cancelPendingRequest])

  const reset = useCallback(() => {
    cancelPendingRequest()
    setData([])
    setError(null)
    setHasMore(true)
    cursorRef.current = null
    isInitialMount.current = true
  }, [cancelPendingRequest])

  return {
    data,
    loading,
    error,
    hasMore,
    observerRef,
    reset,
    refetch: fetchNextPage,
  }
}
