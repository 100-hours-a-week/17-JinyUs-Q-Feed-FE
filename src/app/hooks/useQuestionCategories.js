import { useQuery } from '@tanstack/react-query'
import { fetchQuestionCategories } from '@/api/questionApi'

function mapCategories(response) {
  const data = response?.data ?? response ?? {}
  const categories = data.categories ?? {}
  return categories && typeof categories === 'object' ? categories : {}
}

export function useQuestionCategories() {
  return useQuery({
    queryKey: ['questions', 'categories'],
    queryFn: async () => {
      const response = await fetchQuestionCategories()
      return mapCategories(response)
    },
  })
}
