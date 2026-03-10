import { useCallback, useEffect, useRef, useState } from 'react'
import { getFileReadPresignedUrl } from '@/api/fileApi'

const MAX_PREFETCH_CONCURRENCY = 4

const toTrimmedString = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed || ''
}

const toFileId = (value) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value)
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10)
    return parsed > 0 ? parsed : null
  }
  return null
}

const parseAmzDateMs = (value) => {
  const normalized = toTrimmedString(value)
  const match = normalized.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/
  )
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  const timestamp = Date.UTC(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10),
    Number.parseInt(minute, 10),
    Number.parseInt(second, 10)
  )
  return Number.isFinite(timestamp) ? timestamp : null
}

const isExpiredS3PresignedUrl = (resourceUrl) => {
  const normalizedUrl = toTrimmedString(resourceUrl)
  if (!normalizedUrl) return true

  let parsedUrl
  try {
    parsedUrl = new URL(normalizedUrl)
  } catch {
    return false
  }

  const amzDateRaw =
    parsedUrl.searchParams.get('X-Amz-Date') ??
    parsedUrl.searchParams.get('x-amz-date')
  const expiresRaw =
    parsedUrl.searchParams.get('X-Amz-Expires') ??
    parsedUrl.searchParams.get('x-amz-expires')

  const issuedAtMs = parseAmzDateMs(amzDateRaw)
  if (issuedAtMs === null) return false

  const expiresSeconds = Number.parseInt(toTrimmedString(expiresRaw), 10)
  if (!Number.isFinite(expiresSeconds) || expiresSeconds < 0) return false

  return Date.now() >= issuedAtMs + expiresSeconds * 1000
}

const hasUnexpiredSourceUrl = (turn) => {
  const sourceUrl = toTrimmedString(turn?.videoPlayUrl)
  if (!sourceUrl) return false
  return !isExpiredS3PresignedUrl(sourceUrl)
}

const mergeChangedEntries = (prev, patch) => {
  const patchEntries = Object.entries(patch)
  if (patchEntries.length === 0) return prev

  let changed = false
  const next = { ...prev }

  for (let idx = 0; idx < patchEntries.length; idx += 1) {
    const [turnKey, sourceUrl] = patchEntries[idx]
    if (!turnKey || !sourceUrl || next[turnKey] === sourceUrl) continue
    next[turnKey] = sourceUrl
    changed = true
  }

  return changed ? next : prev
}

const mapWithConcurrency = async (items, limit, worker) => {
  if (!Array.isArray(items) || items.length === 0) return []

  const normalizedLimit = Math.max(1, Math.trunc(limit) || 1)
  const workers = new Array(Math.min(normalizedLimit, items.length)).fill(null)
  const results = []
  let currentIndex = 0

  await Promise.all(
    workers.map(async () => {
      while (currentIndex < items.length) {
        const itemIndex = currentIndex
        currentIndex += 1

        const item = items[itemIndex]
        try {
          const result = await worker(item)
          if (result) {
            results.push(result)
          }
        } catch {
          // 일부 비디오 URL 조회가 실패해도 나머지는 계속 처리
        }
      }
    })
  )

  return results
}

export const useTurnVideoSource = (interviewHistory = []) => {
  const [resolvedVideoSources, setResolvedVideoSources] = useState({})
  const videoReadUrlCacheRef = useRef(new Map())
  const inFlightVideoReadUrlRef = useRef(new Map())

  const getTurnVideoReadUrl = useCallback(async (fileId, { forceRefresh = false } = {}) => {
    const normalizedFileId = toFileId(fileId)
    if (!normalizedFileId) return ''

    const fileIdKey = String(normalizedFileId)

    if (forceRefresh) {
      videoReadUrlCacheRef.current.delete(fileIdKey)
      inFlightVideoReadUrlRef.current.delete(fileIdKey)
    } else {
      const cachedUrl = toTrimmedString(videoReadUrlCacheRef.current.get(fileIdKey))
      if (cachedUrl) return cachedUrl
    }

    let readPromise = inFlightVideoReadUrlRef.current.get(fileIdKey)
    if (!readPromise) {
      readPromise = getFileReadPresignedUrl(normalizedFileId)
        .then((readResult) => {
          const readPayload = readResult?.data ?? readResult ?? {}
          return toTrimmedString(readPayload.presignedUrl ?? readPayload.presigned_url)
        })
        .finally(() => {
          inFlightVideoReadUrlRef.current.delete(fileIdKey)
        })
      inFlightVideoReadUrlRef.current.set(fileIdKey, readPromise)
    }

    const resolvedUrl = toTrimmedString(await readPromise)
    if (resolvedUrl) {
      videoReadUrlCacheRef.current.set(fileIdKey, resolvedUrl)
    }

    return resolvedUrl
  }, [])

  const ensureTurnVideoUrl = useCallback(async (turn, { forceRefresh = false } = {}) => {
    const turnKey = toTrimmedString(turn?.turnKey)
    if (!turnKey) return ''

    if (!forceRefresh && hasUnexpiredSourceUrl(turn)) {
      return toTrimmedString(turn?.videoPlayUrl)
    }

    const videoFileId = toFileId(turn?.videoFileId)
    if (!videoFileId) {
      return forceRefresh ? '' : toTrimmedString(turn?.videoPlayUrl)
    }

    const refreshedUrl = await getTurnVideoReadUrl(videoFileId, { forceRefresh })
    if (!refreshedUrl) return ''

    setResolvedVideoSources((prev) => mergeChangedEntries(prev, { [turnKey]: refreshedUrl }))
    return refreshedUrl
  }, [getTurnVideoReadUrl])

  const refreshTurnVideoUrl = useCallback((turn) => {
    return ensureTurnVideoUrl(turn, { forceRefresh: true })
  }, [ensureTurnVideoUrl])

  const getTurnVideoUrl = useCallback((turn) => {
    const turnKey = toTrimmedString(turn?.turnKey)
    if (!turnKey) return ''

    const resolvedUrl = toTrimmedString(resolvedVideoSources[turnKey])
    if (resolvedUrl) return resolvedUrl

    return hasUnexpiredSourceUrl(turn) ? toTrimmedString(turn?.videoPlayUrl) : ''
  }, [resolvedVideoSources])

  useEffect(() => {
    let cancelled = false

    const targets = interviewHistory.filter((turn) => {
      const turnKey = toTrimmedString(turn?.turnKey)
      if (!turnKey) return false
      if (resolvedVideoSources[turnKey]) return false
      return !hasUnexpiredSourceUrl(turn) && Boolean(toFileId(turn?.videoFileId))
    })

    if (targets.length === 0) return () => {
      cancelled = true
    }

    const prefetchTurnVideos = async () => {
      const fetchedEntries = await mapWithConcurrency(
        targets,
        MAX_PREFETCH_CONCURRENCY,
        async (turn) => {
          const turnKey = toTrimmedString(turn?.turnKey)
          if (!turnKey) return null

          const fallbackUrl = toTrimmedString(await getTurnVideoReadUrl(turn.videoFileId))
          if (!fallbackUrl) return null

          return [turnKey, fallbackUrl]
        }
      )

      if (cancelled || fetchedEntries.length === 0) return

      const nextEntries = fetchedEntries.reduce((acc, entry) => {
        const [turnKey, sourceUrl] = entry
        if (!turnKey || !sourceUrl) return acc
        acc[turnKey] = sourceUrl
        return acc
      }, {})

      setResolvedVideoSources((prev) => mergeChangedEntries(prev, nextEntries))
    }

    void prefetchTurnVideos()

    return () => {
      cancelled = true
    }
  }, [getTurnVideoReadUrl, interviewHistory, resolvedVideoSources])

  return {
    ensureTurnVideoUrl,
    refreshTurnVideoUrl,
    getTurnVideoUrl,
  }
}
