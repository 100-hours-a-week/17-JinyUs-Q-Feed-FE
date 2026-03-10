import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { CornerDownRight } from 'lucide-react'

const TEXT_VIDEO_LABEL = '답변 영상'
const TEXT_VIDEO_MISSING_CARD = '영상이 없습니다.'
const TEXT_VIDEO_LOADING = '영상 불러오는 중...'
const OBSERVER_ROOT_MARGIN = '120px 0px'

const toTrimmedString = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed || ''
}

const TopicTurnVideoCard = ({
  turn,
  videoUrl,
  onEnsureVideoUrl,
  onRefreshVideoUrl,
}) => {
  const containerRef = useRef(null)
  const refreshAttemptedRef = useRef(false)
  const [isInViewport, setIsInViewport] = useState(false)
  const [isSourceLoading, setIsSourceLoading] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isVideoLoadFailed, setIsVideoLoadFailed] = useState(false)

  const turnKey = toTrimmedString(turn?.turnKey)
  const answerText = toTrimmedString(turn?.answerText)
  const resolvedVideoUrl = toTrimmedString(videoUrl)
  const hasVideoFileId = Boolean(turn?.videoFileId)

  useEffect(() => {
    setIsInViewport(false)
    setIsSourceLoading(false)
    setIsVideoReady(false)
    setIsVideoLoadFailed(false)
    refreshAttemptedRef.current = false
  }, [turnKey])

  useEffect(() => {
    setIsVideoReady(false)
  }, [resolvedVideoUrl])

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
      setIsInViewport(true)
      return undefined
    }

    let cancelled = false
    const observer = new window.IntersectionObserver(
      (entries) => {
        const entry = entries?.[0]
        if (!entry || cancelled) return
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setIsInViewport(true)
          observer.disconnect()
        }
      },
      { rootMargin: OBSERVER_ROOT_MARGIN }
    )

    observer.observe(node)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [turnKey])

  useEffect(() => {
    let cancelled = false

    if (
      !isInViewport ||
      resolvedVideoUrl ||
      !hasVideoFileId ||
      typeof onEnsureVideoUrl !== 'function'
    ) {
      return () => {
        cancelled = true
      }
    }

    const resolveVideoUrl = async () => {
      setIsSourceLoading(true)
      try {
        await onEnsureVideoUrl(turn)
      } finally {
        if (!cancelled) {
          setIsSourceLoading(false)
        }
      }
    }

    void resolveVideoUrl()

    return () => {
      cancelled = true
    }
  }, [
    hasVideoFileId,
    isInViewport,
    onEnsureVideoUrl,
    resolvedVideoUrl,
    turn,
  ])

  const handleVideoError = useCallback(async () => {
    setIsVideoReady(false)
    setIsVideoLoadFailed(true)

    if (
      refreshAttemptedRef.current ||
      !hasVideoFileId ||
      typeof onRefreshVideoUrl !== 'function'
    ) {
      return
    }

    refreshAttemptedRef.current = true
    setIsSourceLoading(true)

    try {
      const refreshedUrl = await onRefreshVideoUrl(turn)
      if (toTrimmedString(refreshedUrl)) {
        setIsVideoLoadFailed(false)
      }
    } finally {
      setIsSourceLoading(false)
    }
  }, [hasVideoFileId, onRefreshVideoUrl, turn])

  const canRenderVideoPlayer = isInViewport && Boolean(resolvedVideoUrl) && !isVideoLoadFailed
  const showVideoOverlay = canRenderVideoPlayer && !isVideoReady
  const showLoadingFallback = !canRenderVideoPlayer && (isSourceLoading || (hasVideoFileId && isInViewport))

  return (
    <div ref={containerRef} className="rounded-lg border border-primary-200/70 bg-primary-100/55 p-3 space-y-2">
      <p className="text-xs font-semibold text-primary-700">{TEXT_VIDEO_LABEL}</p>

      <div className="space-y-1">
        {canRenderVideoPlayer ? (
          <div className="relative">
            <video
              key={`${turnKey}-${resolvedVideoUrl}`}
              controls
              preload="metadata"
              playsInline
              className="w-full aspect-video rounded-lg border border-gray-200 bg-black"
              src={resolvedVideoUrl}
              onError={() => {
                void handleVideoError()
              }}
              onLoadedData={() => {
                setIsVideoReady(true)
                setIsVideoLoadFailed(false)
              }}
            />
            {showVideoOverlay && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/65">
                <p className="text-xs text-white/90">{TEXT_VIDEO_LOADING}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center">
            <p className="text-sm font-medium text-gray-600">
              {showLoadingFallback ? TEXT_VIDEO_LOADING : TEXT_VIDEO_MISSING_CARD}
            </p>
          </div>
        )}

      </div>

      {answerText && (
        <div className="space-y-1">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words inline-flex items-start gap-1.5">
            <CornerDownRight className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{answerText}</span>
          </p>
        </div>
      )}
    </div>
  )
}

const areEqual = (prevProps, nextProps) => {
  const prevTurn = prevProps.turn ?? {}
  const nextTurn = nextProps.turn ?? {}

  return (
    prevTurn.turnKey === nextTurn.turnKey &&
    prevTurn.answerText === nextTurn.answerText &&
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.onEnsureVideoUrl === nextProps.onEnsureVideoUrl &&
    prevProps.onRefreshVideoUrl === nextProps.onRefreshVideoUrl
  )
}

export default memo(TopicTurnVideoCard, areEqual)
