import { useQuery } from '@tanstack/react-query'
import { fetchWeeklyStats } from '@/api/userApi'

export function useWeeklyStats() {
  return useQuery({
    queryKey: ['weeklyStats'],
    queryFn: fetchWeeklyStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
