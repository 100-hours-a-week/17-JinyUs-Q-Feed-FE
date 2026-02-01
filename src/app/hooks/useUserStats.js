import { useQuery } from '@tanstack/react-query'
import { fetchUserStats } from '@/api/userApi'

export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
  })
}
