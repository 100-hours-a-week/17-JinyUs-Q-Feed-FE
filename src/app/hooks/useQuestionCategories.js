import { useQuery } from '@tanstack/react-query'
import { fetchQuestionCategories } from '@/api/questionApi'

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function mapCategories(response) {
  const categories = response?.data?.categories
  if (!isPlainObject(categories)) {
    return {
      byType: {},
      flat: {},
    }
  }

  const byType = {}
  const flat = {}

  Object.entries(categories).forEach(([typeKey, categoryGroup]) => {
    if (!isPlainObject(categoryGroup)) return

    const normalizedGroup = {}
    Object.entries(categoryGroup).forEach(([categoryKey, label]) => {
      if (typeof label !== 'string') return
      normalizedGroup[categoryKey] = label
      flat[categoryKey] = label
    })

    if (Object.keys(normalizedGroup).length > 0) {
      byType[typeKey] = normalizedGroup
    }
  })

  return {
    byType,
    flat,
  }
}

export function useQuestionCategories() {
  return useQuery({
    queryKey: ['questions', 'categories'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const response = await fetchQuestionCategories()
      return mapCategories(response)
    },
  })
}
