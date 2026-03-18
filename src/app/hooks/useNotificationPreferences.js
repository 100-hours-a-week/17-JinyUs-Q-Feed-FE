import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotificationPreferences, updateNotificationPreference } from '@/api/notificationApi'
import { toast } from 'sonner'

const QUERY_KEY = ['notification', 'preferences']

// 배열 → { [type]: enabled } 맵 변환
function toMap(list = []) {
  return list.reduce((acc, item) => {
    acc[item.notificationType] = item.enabled
    return acc
  }, {})
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetchNotificationPreferences()
      return toMap(res?.data ?? [])
    },
    staleTime: 30_000,
  })

  const prefMap = data ?? {}

  const { mutate, isPending, variables } = useMutation({
    mutationFn: ({ type, enabled }) => updateNotificationPreference(type, enabled),
    onMutate: async ({ type, enabled }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const prev = queryClient.getQueryData(QUERY_KEY)
      queryClient.setQueryData(QUERY_KEY, (old = {}) => ({ ...old, [type]: enabled }))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(QUERY_KEY, ctx.prev)
      toast.error('알림 설정 변경에 실패했습니다.')
    },
    onSuccess: () => {
      toast.success('알림 설정이 저장되었습니다.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  // 현재 진행 중인 mutation의 type — 해당 Switch 비활성화에 사용
  const pendingType = isPending ? variables?.type : null

  return { prefMap, isLoading, mutate, pendingType }
}
