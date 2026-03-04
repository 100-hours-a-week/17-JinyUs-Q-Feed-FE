import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notificationApi'

const PAGE_SIZE = 20

export const NOTIFICATIONS_QUERY_KEY = ['notifications']

export function useNotificationsInfinite() {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async ({ pageParam = null }) => {
      const response = await fetchNotifications({ cursor: pageParam, limit: PAGE_SIZE })
      const { records = [], pagination = {} } = response?.data ?? response ?? {}
      return { records, pagination }
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
  })

  const notifications = query.data?.pages.flatMap((p) => p.records) ?? []

  const { mutate: readOne } = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      const prev = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY)
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            records: page.records.map((n) => (n.id === id ? { ...n, read: true } : n)),
          })),
        }
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.prev)
    },
  })

  const { mutate: readAll } = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      const prev = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY)
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            records: page.records.map((n) => ({ ...n, read: true })),
          })),
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.prev)
    },
  })

  return {
    notifications,
    ...query,
    readOne,
    readAll,
  }
}
