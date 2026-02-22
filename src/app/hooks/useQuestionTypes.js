import { useQuery } from '@tanstack/react-query'
import { fetchQuestionTypes } from '@/api/questionApi'

function mapTypes(response) {
  const data = response?.data ?? response ?? {}
  const types = data.types ?? {}

  if (!types || typeof types !== 'object' || Array.isArray(types)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(types).filter(([, value]) => typeof value === 'string')
  )
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
