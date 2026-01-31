import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchAnswers } from '@/api/answerApi'

const PAGE_SIZE = 10

export function useAnswersInfinite({ type, category, dateFrom, dateTo } = {}) {
  return useInfiniteQuery({
    queryKey: ['answers', { type, category, dateFrom, dateTo }],
    queryFn: async ({ pageParam = null }) => {
      const response = await fetchAnswers({
        type,
        category,
        dateFrom,
        dateTo,
        cursor: pageParam,
        limit: PAGE_SIZE,
      })

      const { records = [], pagination = {} } = response?.data ?? response ?? {}
      return { records, pagination }
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.nextCursor : undefined,
  })
}
