const METRIC_DISPLAY_ORDER = ['논리력', '완성도', '전달력', '정확도', '구체성']

const METRIC_ALIAS_TO_KR = {
  logic: '논리력',
  logicality: '논리력',
  completeness: '완성도',
  communication: '전달력',
  delivery: '전달력',
  accuracy: '정확도',
  specificity: '구체성',
}

const METRIC_ORDER_INDEX = METRIC_DISPLAY_ORDER.reduce((acc, name, index) => {
  acc[name] = index
  return acc
}, {})

const toTrimmedString = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed || ''
}

const resolveCanonicalMetricName = (metricName) => {
  const normalized = toTrimmedString(metricName)
  if (!normalized) return ''
  if (Object.prototype.hasOwnProperty.call(METRIC_ORDER_INDEX, normalized)) {
    return normalized
  }

  const aliasMatched = METRIC_ALIAS_TO_KR[normalized.toLowerCase()]
  return aliasMatched || normalized
}

export const getMetricOrderIndex = (metricName) => {
  const canonicalName = resolveCanonicalMetricName(metricName)
  if (!canonicalName) return Number.MAX_SAFE_INTEGER
  if (!Object.prototype.hasOwnProperty.call(METRIC_ORDER_INDEX, canonicalName)) {
    return Number.MAX_SAFE_INTEGER
  }
  return METRIC_ORDER_INDEX[canonicalName]
}

export const sortMetricsByDisplayOrder = (metrics, getMetricName) => {
  if (!Array.isArray(metrics) || metrics.length <= 1) return Array.isArray(metrics) ? metrics : []

  const readMetricName = typeof getMetricName === 'function'
    ? getMetricName
    : (metric) => metric?.name

  return metrics
    .map((metric, originalIndex) => ({
      metric,
      originalIndex,
      orderIndex: getMetricOrderIndex(readMetricName(metric)),
    }))
    .sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
      return a.originalIndex - b.originalIndex
    })
    .map((item) => item.metric)
}

