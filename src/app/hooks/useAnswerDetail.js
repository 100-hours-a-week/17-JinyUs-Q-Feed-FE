import { useQuery } from '@tanstack/react-query'
import { fetchAnswerDetail } from '@/api/answerApi'

export function useAnswerDetail(answerId) {
  return useQuery({
    queryKey: ['answerDetail', answerId],
    queryFn: () =>
      fetchAnswerDetail(answerId, {
        expand: ['question', 'feedback', 'immediate_feedback'],
      }),
    enabled: Boolean(answerId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
