import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  deleteMyPortfolio,
  fetchMyPortfolio,
  fetchTechStacks,
  replaceMyPortfolio,
} from '@/api/portfolioApi'
import { useDebounce } from '@/app/hooks/useDebounce'
import { isPortfolioNotFoundError } from '@/app/utils/portfolio'

export const PORTFOLIO_QUERY_KEY = ['portfolio', 'me']
export const TECH_STACKS_QUERY_KEY = ['portfolio', 'tech-stacks']
const TECH_STACKS_PAGE_SIZE = 20

const EMPTY_PORTFOLIO = Object.freeze({
  portfolioId: null,
  projects: [],
})

const toTrimmedString = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed || ''
}

const toNullableString = (value) => {
  const trimmed = toTrimmedString(value)
  return trimmed || null
}

function normalizeTechStack(techStack) {
  const techStackId = Number(techStack?.techStackId)

  return {
    techStackId: Number.isInteger(techStackId) ? techStackId : 0,
    name: toTrimmedString(techStack?.name),
    description: toTrimmedString(techStack?.description),
  }
}

function normalizeProjectTechStack(techStack) {
  const techStackId = Number(techStack?.techStackId)

  return {
    techStackId: Number.isInteger(techStackId) ? techStackId : 0,
    techStackName: toTrimmedString(techStack?.techStackName || techStack?.name),
  }
}

function normalizeProject(project) {
  const projectId = Number(project?.projectId)
  const architectureImageFileId = Number(
    project?.architectureImageFileId ??
      project?.architecture_image_file_id ??
      project?.architectureImageFile?.fileId ??
      project?.architectureImageFile?.file_id
  )

  return {
    projectId: Number.isInteger(projectId) ? projectId : 0,
    projectName: toTrimmedString(project?.projectName),
    content: toTrimmedString(project?.content),
    architectureImageFileId:
      Number.isInteger(architectureImageFileId) && architectureImageFileId > 0
        ? architectureImageFileId
        : null,
    architectureImageUrl: toNullableString(
      project?.architectureImageUrl ??
        project?.architecture_image_url ??
        project?.architectureImageFile?.fileUrl ??
        project?.architectureImageFile?.file_url
    ),
    techStacks: Array.isArray(project?.techStacks)
      ? project.techStacks
          .map(normalizeProjectTechStack)
          .filter((techStack) => techStack.techStackId > 0)
      : [],
  }
}

function normalizePortfolioResponse(response) {
  const payload = response?.data ?? response ?? {}
  const portfolioId = Number(payload?.portfolioId)

  return {
    portfolioId: Number.isInteger(portfolioId) ? portfolioId : null,
    projects: Array.isArray(payload?.projects)
      ? payload.projects.map(normalizeProject).filter((project) => project.projectId > 0)
      : [],
  }
}

function normalizeTechStacksResponse(response) {
  const payload = response?.data ?? response ?? {}
  const pagination = payload?.pagination ?? {}

  return {
    records: Array.isArray(payload?.techStacks)
      ? payload.techStacks
          .map(normalizeTechStack)
          .filter((techStack) => techStack.techStackId > 0 && techStack.name)
      : [],
    pagination: {
      nextCursor: pagination?.nextCursor ?? null,
      hasNext: Boolean(pagination?.hasNext),
      size: Number(pagination?.size) || TECH_STACKS_PAGE_SIZE,
    },
  }
}

export function usePortfolio() {
  return useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: async ({ signal }) => {
      try {
        const response = await fetchMyPortfolio({ signal })
        return normalizePortfolioResponse(response)
      } catch (error) {
        if (isPortfolioNotFoundError(error)) {
          return EMPTY_PORTFOLIO
        }
        throw error
      }
    },
  })
}

export function useTechStacks({ query = '', size = TECH_STACKS_PAGE_SIZE } = {}) {
  const normalizedQuery = toTrimmedString(query)
  const debouncedQuery = useDebounce(normalizedQuery, 300)
  const hasQuery = debouncedQuery.length > 0
  const normalizedSize =
    Number.isFinite(size) && size > 0 ? Math.min(Math.floor(size), 100) : TECH_STACKS_PAGE_SIZE

  const result = useInfiniteQuery({
    queryKey: [...TECH_STACKS_QUERY_KEY, { query: debouncedQuery, size: normalizedSize }],
    enabled: hasQuery,
    queryFn: async ({ pageParam = null, signal }) => {
      const response = await fetchTechStacks({
        q: debouncedQuery || undefined,
        cursor: pageParam,
        size: normalizedSize,
        signal,
      })
      return normalizeTechStacksResponse(response)
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.nextCursor : undefined,
  })

  const techStacks = useMemo(() => {
    const records = result.data?.pages?.flatMap((page) => page.records) ?? []
    const dedupedTechStacks = []
    const seenIds = new Set()

    records.forEach((techStack) => {
      if (seenIds.has(techStack.techStackId)) return
      seenIds.add(techStack.techStackId)
      dedupedTechStacks.push(techStack)
    })

    return dedupedTechStacks
  }, [result.data])

  return {
    ...result,
    techStacks,
    debouncedQuery,
    hasQuery,
  }
}

export function useReplacePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: replaceMyPortfolio,
    onSuccess: async () => {
      // Mutation response can omit fields used by the list view, so resync from source of truth.
      await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY })
    },
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMyPortfolio,
    onSuccess: () => {
      queryClient.setQueryData(PORTFOLIO_QUERY_KEY, EMPTY_PORTFOLIO)
    },
  })
}
