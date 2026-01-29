import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchQuestions, searchQuestions } from '@/api/questionApi'

const PAGE_SIZE = 10

function mapQuestions(response) {
  const items = response?.data?.questions ?? []
  const pagination = response?.data?.pagination ?? {}

  const records = items.map((question) => ({
    id: question.questionId ?? question.id,
    title: question.content ?? question.title ?? '',
    description: question.content ?? '',
    category: question.category ?? '',
    keywords: Array.isArray(question.keywords) ? question.keywords : [],
  }))

  return { records, pagination }
}

export function useQuestionsInfinite({ query = '', type, category } = {}) {
  return useInfiniteQuery({
    queryKey: ['questions', { query, type, category }],
    queryFn: async ({ pageParam = null }) => {
      const response =
        query.length >= 2
          ? await searchQuestions({ q: query, type, category, cursor: pageParam, size: PAGE_SIZE })
          : await fetchQuestions({ type, category, cursor: pageParam, size: PAGE_SIZE })

      return mapQuestions(response)
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.nextCursor : undefined,
  })
}
