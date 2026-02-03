import { useQuery } from '@tanstack/react-query'
import { fetchQuestionTypes } from '@/api/questionApi'

function mapTypes(response) {
  const data = response?.data ?? response ?? {}
  const types = data.types ?? {}
  return types && typeof types === 'object' ? types : {}
}

export function useQuestionTypes() {
  return useQuery({
    queryKey: ['questions', 'types'],
    queryFn: async () => {
      const response = await fetchQuestionTypes()
      return mapTypes(response)
    },
  })
}
