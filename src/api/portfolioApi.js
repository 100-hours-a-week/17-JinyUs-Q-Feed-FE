import { api } from '@/utils/apiUtils'

export async function fetchTechStacks({ q, cursor, size = 20, signal } = {}) {
  const params = new URLSearchParams()
  const normalizedQuery = typeof q === 'string' ? q.trim() : ''

  if (normalizedQuery) {
    params.set('q', normalizedQuery)
  }

  if (cursor !== undefined && cursor !== null && cursor !== '') {
    params.set('cursor', String(cursor))
  }

  if (Number.isFinite(size) && size > 0) {
    params.set('size', String(Math.min(size, 100)))
  }

  const queryString = params.toString()

  return api.get(queryString ? `/api/tech-stacks?${queryString}` : '/api/tech-stacks', {
    parseResponse: true,
    signal,
  })
}

export async function fetchMyPortfolio({ signal } = {}) {
  return api.get('/api/portfolio/me', {
    parseResponse: true,
    signal,
  })
}

export async function replaceMyPortfolio(payload) {
  return api.put('/api/portfolio/me', payload, {
    parseResponse: true,
  })
}

export async function deleteMyPortfolio() {
  return api.delete('/api/portfolio/me', {
    parseResponse: true,
  })
}
