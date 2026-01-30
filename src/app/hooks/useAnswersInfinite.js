import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchAnswers } from '@/api/answerApi'

const PAGE_SIZE = 10

export function useAnswersInfinite({ type, expand } = {}) {
  return useInfiniteQuery({
    queryKey: ['answers', { type, expand }],
    queryFn: async ({ pageParam = null }) => {
      const response = await fetchAnswers({
        type,
        expand,
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
